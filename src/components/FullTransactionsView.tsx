import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft,
  Search, 
  ArrowUpDown, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  Calendar,
  Layers,
  Inbox,
  X,
  Paperclip,
  Printer,
  FileSpreadsheet,
  Edit2,
  Edit3,
  Trash2,
  IndianRupee,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Transaction, CategoriesData, BillAttachment } from '../types';
import { formatINR } from '../utils/currency';
import { getTxSignature } from '../services/attachmentStore';
import { EditTransactionModal } from './EditTransactionModal';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';
import { BulkEditModal } from './BulkEditModal';
import { BulkDeleteConfirmModal } from './BulkDeleteConfirmModal';
import { CuteToyTrain } from './CuteToyTrain';
import { ToyAirplane, RockingHorseToy, MechanicalGearToy, PinwheelToy } from './PlayfulToysAmbient';

interface FullTransactionsViewProps {
  transactions: Transaction[];
  categories: CategoriesData;
  items: string[];
  sellers: string[];
  onBackToDashboard: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  onEditTransaction: (tx: Transaction) => Promise<void>;
  onDeleteTransaction: (txId: string, rowNumber?: number, txDetails?: Partial<Transaction>) => Promise<void>;
  onBulkDeleteTransactions?: (txs: Transaction[], onProgress?: (done: number, total: number) => void) => Promise<void>;
  onBulkEditTransactions?: (txs: Transaction[], onProgress?: (done: number, total: number) => void) => Promise<void>;
}

// Today's date string in local time YYYY-MM-DD
const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const FullTransactionsView: React.FC<FullTransactionsViewProps> = ({
  transactions,
  categories,
  items,
  sellers,
  onBackToDashboard,
  onRefresh,
  isLoading,
  onEditTransaction,
  onDeleteTransaction,
  onBulkDeleteTransactions,
  onBulkEditTransactions,
}) => {
  const todayStr = getTodayStr();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Bulk Selection states
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Editing & Deleting states
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewAttachments, setPreviewAttachments] = useState<BillAttachment[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [previewTxId, setPreviewTxId] = useState<string | undefined>(undefined);
  const [previewSignature, setPreviewSignature] = useState<string | undefined>(undefined);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const handleOpenPreview = (atts: BillAttachment[], index: number = 0, txId?: string, sig?: string) => {
    setPreviewAttachments(atts);
    setPreviewIndex(index);
    setPreviewTxId(txId);
    setPreviewSignature(sig);
    setIsPreviewOpen(true);
  };

  // Date shortcuts
  const handleSetQuickRange = (range: 'this-month' | 'last-month' | 'this-year' | 'last-30' | 'all') => {
    const now = new Date();
    if (range === 'all') {
      setStartDate('');
      setEndDate(todayStr);
      return;
    }
    if (range === 'this-month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      const endOfMonth = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      setStartDate(`${year}-${month}-01`);
      setEndDate(endOfMonth > todayStr ? todayStr : endOfMonth);
      return;
    }
    if (range === 'last-month') {
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = prevDate.getFullYear();
      const month = String(prevDate.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, prevDate.getMonth() + 1, 0).getDate();
      const endOfMonth = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      setStartDate(`${year}-${month}-01`);
      setEndDate(endOfMonth > todayStr ? todayStr : endOfMonth);
      return;
    }
    if (range === 'this-year') {
      const year = now.getFullYear();
      setStartDate(`${year}-01-01`);
      setEndDate(todayStr);
      return;
    }
    if (range === 'last-30') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const pastYear = past.getFullYear();
      const pastMonth = String(past.getMonth() + 1).padStart(2, '0');
      const pastDay = String(past.getDate()).padStart(2, '0');
      setStartDate(`${pastYear}-${pastMonth}-${pastDay}`);
      setEndDate(todayStr);
      return;
    }
  };

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        if (t.date && t.date > todayStr) return false;
        if (typeFilter !== 'All' && t.type !== typeFilter) return false;
        if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
        if (startDate && t.date < startDate) return false;
        if (endDate && t.date > endDate) return false;
        
        const minVal = parseFloat(minAmount);
        if (!isNaN(minVal) && t.amount < minVal) return false;

        const maxVal = parseFloat(maxAmount);
        if (!isNaN(maxVal) && t.amount > maxVal) return false;

        if (!searchTerm.trim()) return true;

        const term = searchTerm.toLowerCase();
        return (
          t.category.toLowerCase().includes(term) ||
          t.note.toLowerCase().includes(term) ||
          t.date.includes(term) ||
          (t.item && t.item.toLowerCase().includes(term)) ||
          (t.sellerDetails && t.sellerDetails.toLowerCase().includes(term)) ||
          t.amount.toString().includes(term)
        );
      })
      .sort((a, b) => {
        if (sortOrder === 'newest') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortOrder === 'oldest') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortOrder === 'highest') {
          return b.amount - a.amount;
        }
        if (sortOrder === 'lowest') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [transactions, typeFilter, categoryFilter, searchTerm, sortOrder, startDate, endDate, minAmount, maxAmount, todayStr]);

  // Aggregate metrics for filtered subset
  const filteredMetrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'Income') income += t.amount;
      else expense += t.amount;
    });
    return {
      count: filteredTransactions.length,
      income,
      expense,
      balance: income - expense,
    };
  }, [filteredTransactions]);

  // All category options for dropdown
  const allCategoryOptions = useMemo(() => {
    const set = new Set<string>();
    categories.income.forEach((c) => set.add(c));
    categories.expense.forEach((c) => set.add(c));
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort();
  }, [categories, transactions]);

  // CSV Export
  const handleExportCsv = (isExcel = false) => {
    if (filteredTransactions.length === 0) return;

    const headers = ['Timestamp', 'Date', 'Type', 'Category', 'Item', 'Seller Details', 'Amount (INR)', 'Note', 'Bill Attachments'];
    const rows = filteredTransactions.map((t) => {
      const attNames = (t.attachments && t.attachments.length > 0)
        ? t.attachments.map((a) => a.name).join('; ')
        : (t.attachment?.name || '');

      return [
        `"${t.timestamp}"`,
        `"${t.date}"`,
        `"${t.type}"`,
        `"${t.category.replace(/"/g, '""')}"`,
        `"${(t.item || '').replace(/"/g, '""')}"`,
        `"${(t.sellerDetails || '').replace(/"/g, '""')}"`,
        t.amount,
        `"${t.note.replace(/"/g, '""')}"`,
        `"${attNames.replace(/"/g, '""')}"`
      ];
    });

    // Add BOM for Microsoft Excel compatibility
    const bom = isExcel ? '\uFEFF' : '';
    const csvContent = bom + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `naughty_toddlers_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // JSON Export
  const handleExportJson = () => {
    if (filteredTransactions.length === 0) return;
    const jsonStr = JSON.stringify(filteredTransactions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `naughty_toddlers_transactions_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Selected transactions list
  const selectedTransactions = useMemo(() => {
    return transactions.filter((t) => selectedTxIds.has(t.id));
  }, [transactions, selectedTxIds]);

  // Detected duplicate transactions for 1-click cleanup
  const duplicateTransactions = useMemo(() => {
    const seen = new Map<string, Transaction>();
    const dupes: Transaction[] = [];
    for (const t of transactions) {
      const key = `${t.date}_${t.type}_${t.category}_${t.amount}_${t.note}`;
      if (seen.has(key)) {
        dupes.push(t);
      } else {
        seen.set(key, t);
      }
    }
    return dupes;
  }, [transactions]);

  const isAllFilteredSelected =
    filteredTransactions.length > 0 &&
    filteredTransactions.every((tx) => selectedTxIds.has(tx.id));

  const isSomeFilteredSelected =
    filteredTransactions.some((tx) => selectedTxIds.has(tx.id)) && !isAllFilteredSelected;

  const toggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredTransactions.map((t) => t.id));
      setSelectedTxIds((prev) => {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedTxIds((prev) => {
        const next = new Set(prev);
        filteredTransactions.forEach((t) => next.add(t.id));
        return next;
      });
    }
  };

  const toggleSelectTx = (id: string) => {
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedTxIds(new Set());
  };

  const handleBulkDeleteConfirm = async (
    txs: Transaction[],
    onProgress?: (done: number, total: number) => void
  ) => {
    if (onBulkDeleteTransactions) {
      await onBulkDeleteTransactions(txs, onProgress);
    } else {
      let done = 0;
      for (const t of txs) {
        await onDeleteTransaction(t.id, t.rowNumber, t);
        done++;
        if (onProgress) onProgress(done, txs.length);
      }
    }
    clearSelection();
  };

  const handleBulkEditConfirm = async (
    updatedTxs: Transaction[],
    onProgress?: (done: number, total: number) => void
  ) => {
    if (onBulkEditTransactions) {
      await onBulkEditTransactions(updatedTxs, onProgress);
    } else {
      let done = 0;
      for (const t of updatedTxs) {
        await onEditTransaction(t);
        done++;
        if (onProgress) onProgress(done, updatedTxs.length);
      }
    }
    clearSelection();
  };

  const handleConfirmDelete = async () => {
    if (!txToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteTransaction(txToDelete.id, txToDelete.rowNumber, txToDelete);
      setTxToDelete(null);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 antialiased flex flex-col relative overflow-x-hidden">
      {/* Pleasant Toy Airplane Flying Across the Ambient Sky */}
      <ToyAirplane />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                All Transactions Explorer
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Live Data Explorer & Filter Center • Naughty Toddlers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer disabled:opacity-50"
              title="Refresh transactions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Clean Duplicates Button */}
            {duplicateTransactions.length > 0 && onBulkDeleteTransactions && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Found ${duplicateTransactions.length} duplicate record(s). Clean them up now from Google Sheet and app?`)) {
                    onBulkDeleteTransactions(duplicateTransactions);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold shadow-2xs transition-colors cursor-pointer animate-pulse"
                title="Automatically clean detected duplicate entries"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Clean {duplicateTransactions.length} Duplicates</span>
              </button>
            )}

            <button
              onClick={() => handleExportCsv(true)}
              disabled={filteredTransactions.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title="Export as Excel CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel CSV</span>
            </button>

            <button
              onClick={() => handleExportCsv(false)}
              disabled={filteredTransactions.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Print table"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-5 w-full space-y-4">
        {/* KPI Mini-Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Filtered Entries</span>
            <p className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
              {filteredMetrics.count} <span className="text-xs font-normal text-slate-400">/ {transactions.length}</span>
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Total Inflow</span>
            <p className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5">
              +{formatINR(filteredMetrics.income, { showDecimals: false })}
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-rose-100 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Total Outflow</span>
            <p className="text-xl font-extrabold text-rose-600 font-mono mt-0.5">
              -{formatINR(filteredMetrics.expense, { showDecimals: false })}
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Net Flow</span>
            <p className={`text-xl font-extrabold font-mono mt-0.5 ${filteredMetrics.balance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              {filteredMetrics.balance >= 0 ? '+' : ''}{formatINR(filteredMetrics.balance, { showDecimals: false })}
            </p>
          </div>
        </div>

        {/* Filter and Control Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
          {/* Row 1: Search & Type */}
          <div className="p-3.5 sm:p-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search across category, note, item, seller, or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Pill Selector */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold border border-slate-200/60">
                {(['All', 'Income', 'Expense'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setTypeFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                      typeFilter === filter
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Category Dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Categories</option>
                {allCategoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="pl-3 pr-8 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer appearance-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Amount</option>
                  <option value="lowest">Lowest Amount</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 2: Date Filters & Amount Range */}
          <div className="p-3.5 sm:p-4 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Date:</span>
              </span>

              <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400">From</span>
                <input
                  type="date"
                  value={startDate}
                  max={todayStr}
                  onChange={(e) => setStartDate(e.target.value > todayStr ? todayStr : e.target.value)}
                  className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400">To</span>
                <input
                  type="date"
                  value={endDate}
                  max={todayStr}
                  onChange={(e) => setEndDate(e.target.value > todayStr ? todayStr : e.target.value)}
                  className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[11px] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Quick shortcuts */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-slate-400 text-[11px] font-semibold mr-1">Quick:</span>
              <button
                type="button"
                onClick={() => handleSetQuickRange('this-month')}
                className="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] cursor-pointer shadow-2xs"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickRange('last-month')}
                className="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] cursor-pointer shadow-2xs"
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickRange('last-30')}
                className="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] cursor-pointer shadow-2xs"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickRange('this-year')}
                className="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] cursor-pointer shadow-2xs"
              >
                This Year
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickRange('all')}
                className="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] cursor-pointer shadow-2xs"
              >
                All
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Bulk Action Bar (Visible when 1+ transactions are selected) */}
          {selectedTransactions.length > 0 && (
            <div className="p-3 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex flex-wrap items-center justify-between gap-3 border-b border-purple-600 animate-in fade-in duration-150">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center font-black text-xs shrink-0">
                  {selectedTransactions.length}
                </div>
                <div>
                  <p className="text-xs font-black tracking-tight leading-none">
                    {selectedTransactions.length} {selectedTransactions.length === 1 ? 'transaction' : 'transactions'} selected
                  </p>
                  <p className="text-[11px] text-purple-200 mt-0.5">
                    Total value: <strong className="text-white font-mono">{formatINR(selectedTransactions.reduce((s, t) => s + (Number(t.amount) || 0), 0), { showDecimals: false })}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsBulkEditOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-purple-900 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-md"
                  title="Edit selected transactions in bulk"
                >
                  <Edit3 className="w-3.5 h-3.5 text-purple-700" />
                  <span>Bulk Edit ({selectedTransactions.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBulkDeleteOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-md"
                  title="Delete selected transactions in bulk"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedTransactions.length})</span>
                </button>

                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-2.5 py-1.5 rounded-xl hover:bg-white/15 text-purple-200 hover:text-white transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                  title="Clear selection"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Deselect</span>
                </button>
              </div>
            </div>
          )}

          {filteredTransactions.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No matching transactions found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Try modifying your search keywords, category filters, or selected date range.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                    <th className="py-3 px-4 w-[46px] text-center whitespace-nowrap">
                      <input
                        type="checkbox"
                        aria-label="Select all transactions"
                        checked={isAllFilteredSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isSomeFilteredSelected;
                        }}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-purple-600 rounded border-slate-400 focus:ring-purple-500 cursor-pointer accent-purple-600"
                        title={isAllFilteredSelected ? "Deselect all" : "Select all"}
                      />
                    </th>
                    <th className="py-3 px-4 sm:px-5 w-[110px] sm:w-[125px] whitespace-nowrap">Date</th>
                    <th className="py-3 px-4 w-[170px] sm:w-[200px]">Type &amp; Category</th>
                    <th className="py-3 px-4 min-w-[200px]">NOTES &amp; STOCK DETAILS</th>
                    <th className="py-3 px-4 w-[160px] sm:w-[185px]">Bill Attachments</th>
                    <th className="py-3 px-4 sm:px-5 w-[130px] sm:w-[150px] text-right whitespace-nowrap">Amount (₹ INR)</th>
                    <th className="py-3 px-4 text-center w-[76px] sm:w-[84px] whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredTransactions.map((tx) => {
                    const isIncome = tx.type === 'Income';
                    const isSelected = selectedTxIds.has(tx.id);
                    const txAtts: BillAttachment[] = tx.attachments && tx.attachments.length > 0
                      ? tx.attachments
                      : (tx.attachment ? [tx.attachment] : []);

                    return (
                      <tr
                        key={tx.id}
                        className={`transition-colors group ${
                          isSelected
                            ? 'bg-purple-50/90 hover:bg-purple-100/80 ring-1 ring-inset ring-purple-300/60'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Selection Checkbox */}
                        <td className="py-3 px-4 w-[46px] text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`Select transaction ${tx.id}`}
                            checked={isSelected}
                            onChange={() => toggleSelectTx(tx.id)}
                            className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer accent-purple-600"
                          />
                        </td>
                        {/* Date */}
                        <td className="py-3 px-4 sm:px-5 text-xs text-slate-600 font-mono whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{tx.date}</span>
                          </div>
                        </td>

                        {/* Category & Type */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                              }`}
                            >
                              {isIncome ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900 text-xs sm:text-sm">{tx.category}</p>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                                  isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {tx.type}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Note & Stock details */}
                        <td className="py-3 px-4 max-w-xs text-xs text-slate-700">
                          <p className="truncate">{tx.note || <span className="text-slate-300 italic">No notes</span>}</p>
                          {(tx.item || tx.sellerDetails) && (
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              {tx.item && (
                                <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                  📦 {tx.item}
                                </span>
                              )}
                              {tx.sellerDetails && (
                                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                  🏪 {tx.sellerDetails}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Attachments */}
                        <td className="py-3 px-4 w-[160px] sm:w-[185px]">
                          {txAtts.length === 0 ? (
                            <span className="text-slate-300 text-xs italic">None</span>
                          ) : (
                            <div className="flex flex-col gap-1 w-full max-w-[175px]">
                              {txAtts.map((att, attIdx) => {
                                const isImg = att.dataUrl || att.type.startsWith('image/') || att.name.match(/\.(jpg|jpeg|png|webp|gif)$/i);
                                return (
                                  <button
                                    key={att.id || attIdx}
                                    type="button"
                                    onClick={() => handleOpenPreview(txAtts, attIdx, tx.id, getTxSignature(tx.date, tx.amount, tx.category))}
                                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100 hover:text-indigo-900 px-2 py-1 rounded-lg border border-indigo-200 transition-all w-full shadow-2xs group cursor-pointer text-left truncate"
                                    title={`Click to preview bill: ${att.name}`}
                                  >
                                    {att.dataUrl && isImg ? (
                                      <img
                                        src={att.dataUrl}
                                        alt={att.name}
                                        className="w-5 h-5 rounded object-cover border border-indigo-300 shrink-0 group-hover:scale-110 transition-transform bg-white"
                                      />
                                    ) : (
                                      <Paperclip className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform shrink-0" />
                                    )}
                                    <span className="truncate flex-1">{att.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 sm:px-5 text-right whitespace-nowrap">
                          <span
                            className={`font-extrabold font-mono text-xs sm:text-sm ${
                              isIncome ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isIncome ? '+' : '-'}
                            {formatINR(tx.amount)}
                          </span>
                        </td>

                        {/* Action buttons (Edit & Delete) */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingTx(tx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Edit transaction"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setTxToDelete(tx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
 
      {/* Playful Kids Toys & Mechanical Toys vignette in Transactions Tab */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full mt-5 mb-2 flex items-center justify-between text-slate-400 select-none pointer-events-none opacity-80 sm:opacity-90">
        <div className="flex items-center gap-3">
          <RockingHorseToy />
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Play • Learn • Grow • Smile</span>
            <span className="text-[9px] text-slate-400">Little Essentials for Brighter Tomorrows</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PinwheelToy />
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/80 border border-slate-200/70 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-600">Clockwork Toys &amp; Essentials</span>
          </div>
          <MechanicalGearToy />
        </div>
      </div>

      {/* Cute Toy Train Track at bottom of transactions tab view */}
      <div id="toy-train-track-section-full" data-train-track="true" className="w-full mt-1 mb-6 overflow-hidden opacity-90">
        <CuteToyTrain compact />
      </div>

      {/* Edit Transaction Modal */}
      {editingTx && (
        <EditTransactionModal
          isOpen={true}
          onClose={() => setEditingTx(null)}
          transaction={editingTx}
          categories={categories}
          items={items}
          sellers={sellers}
          onSave={onEditTransaction}
        />
      )}

      {/* Delete Transaction Confirmation Modal */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Transaction</h3>
                <p className="text-xs text-slate-500">Are you sure you want to delete this record?</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="text-slate-600">
                <span className="font-bold text-slate-900">{txToDelete.category}</span> ({txToDelete.type})
              </p>
              <p className="font-extrabold font-mono text-slate-900 text-sm">
                ₹{txToDelete.amount.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-500">Date: {txToDelete.date}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setTxToDelete(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      <AttachmentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        attachments={previewAttachments}
        initialIndex={previewIndex}
        txId={previewTxId}
        signature={previewSignature}
      />

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        selectedTransactions={selectedTransactions}
        categories={categories}
        items={items}
        sellers={sellers}
        onApplyBulkEdit={handleBulkEditConfirm}
      />

      {/* Bulk Delete Confirm Modal */}
      <BulkDeleteConfirmModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        selectedTransactions={selectedTransactions}
        onConfirmDelete={handleBulkDeleteConfirm}
      />
    </div>
  );
};
