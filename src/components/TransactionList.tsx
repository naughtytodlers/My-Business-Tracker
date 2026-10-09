import React, { useState, useMemo } from 'react';
import { 
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
  ExternalLink,
  Edit2,
  Edit3,
  Trash2
} from 'lucide-react';
import { Transaction, CategoriesData, BillAttachment } from '../types';
import { formatINR } from '../utils/currency';
import { EditTransactionModal } from './EditTransactionModal';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';
import { BulkEditModal } from './BulkEditModal';
import { BulkDeleteConfirmModal } from './BulkDeleteConfirmModal';
import { PinwheelToy } from './PlayfulToysAmbient';
import { Eye } from 'lucide-react';
import { getTxSignature } from '../services/attachmentStore';

interface TransactionListProps {
  transactions: Transaction[];
  onRefresh: () => void;
  isLoading: boolean;
  categories: CategoriesData;
  items: string[];
  sellers: string[];
  onEditTransaction?: (tx: Transaction) => Promise<void>;
  onDeleteTransaction?: (txId: string, rowNumber?: number, txDetails?: Partial<Transaction>) => Promise<void>;
  onBulkDeleteTransactions?: (txs: Transaction[], onProgress?: (done: number, total: number) => void) => Promise<void>;
  onBulkEditTransactions?: (txs: Transaction[], onProgress?: (done: number, total: number) => void) => Promise<void>;
  onOpenFullView?: () => void;
}

// Today's date string in local time YYYY-MM-DD
const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  items,
  sellers,
  onEditTransaction,
  onDeleteTransaction,
  onBulkDeleteTransactions,
  onBulkEditTransactions,
  onOpenFullView,
}) => {
  const todayStr = getTodayStr();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest'>('newest');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Bulk Selection states
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Editing & Deleting states
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Attachment Preview State
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

  // Quick Date Range Presets (Strictly capped at present day / today - no future dates)
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
      // Keep till today / present day
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
      // Keep till today / present day
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

  // Filtered & Sorted Transactions (Exclude future dates)
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Enforce no future dates - keep till today / present day
        if (t.date && t.date > todayStr) return false;

        if (typeFilter !== 'All' && t.type !== typeFilter) return false;
        if (startDate && t.date < startDate) return false;
        if (endDate && t.date > endDate) return false;
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
        return 0;
      });
  }, [transactions, typeFilter, searchTerm, sortOrder, startDate, endDate]);

  const handleExportCsv = () => {
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

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `naughty_toddlers_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Selected transactions list
  const selectedTransactions = useMemo(() => {
    return transactions.filter((t) => selectedTxIds.has(t.id));
  }, [transactions, selectedTxIds]);

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

  const handleBulkDeleteConfirm = async (
    txs: Transaction[],
    onProgress?: (done: number, total: number) => void
  ) => {
    if (onBulkDeleteTransactions) {
      await onBulkDeleteTransactions(txs, onProgress);
    } else if (onDeleteTransaction) {
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
    } else if (onEditTransaction) {
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
    if (!txToDelete || !onDeleteTransaction) return;
    setIsDeleting(true);
    try {
      await onDeleteTransaction(txToDelete.id, txToDelete.rowNumber, txToDelete);
      setTxToDelete(null);
    } catch (err) {
      console.error('Error deleting transaction:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
      {/* Light Grey Header */}
      <div className="p-3.5 sm:p-4 bg-slate-200 border-b border-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-300/90 border border-slate-400/40 text-slate-800 flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <Layers className="w-4 h-4 text-slate-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                Transaction History
              </h2>
              <PinwheelToy className="scale-65 origin-center shrink-0 hidden sm:flex -my-2" />
            </div>
            <p className="text-[11px] text-slate-600 font-semibold">
              {filteredTransactions.length} of {transactions.length} records • Real-time synchronized
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* View in New Tab Button */}
          <a
            href={`${window.location.pathname}#/transactions-full`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (onOpenFullView) {
                // Also support in-app open if user clicks directly
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title="Open all transactions in a separate tab to filter and download"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
            <span>View in New Tab</span>
          </a>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            disabled={filteredTransactions.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Clean Duplicates Button (Visible when duplicate records exist) */}
          {duplicateTransactions.length > 0 && onBulkDeleteTransactions && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Found ${duplicateTransactions.length} duplicate record(s). Clean them up now from Google Sheet and app?`)) {
                  onBulkDeleteTransactions(duplicateTransactions);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold shadow-2xs transition-colors cursor-pointer animate-pulse"
              title="Automatically delete detected duplicate entries"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Clean {duplicateTransactions.length} Duplicates</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and search controls bar */}
      <div className="p-3 sm:p-3.5 bg-slate-100/90 border-b border-slate-200/90 flex flex-col md:flex-row gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by category, note, date, or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* Filter Buttons & Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-200/90 p-0.5 rounded-lg text-xs font-semibold">
            {(['All', 'Income', 'Expense'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setTypeFilter(filter)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-xs ${
                  typeFilter === filter
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="pl-2.5 pr-7 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* From-To Date Range Search & Shortcuts Bar */}
      <div className="px-3 sm:px-4 py-2.5 bg-slate-50 border-b border-slate-200/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 font-bold text-slate-700 text-xs shrink-0">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filter Dates:</span>
          </div>

          {/* From Date Input */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From:</span>
            <input
              type="date"
              value={startDate}
              max={todayStr}
              onChange={(e) => {
                const val = e.target.value;
                if (!val || val <= todayStr) {
                  setStartDate(val);
                } else {
                  setStartDate(todayStr);
                }
              }}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
              title="Start Date (up to today)"
            />
          </div>

          {/* To Date Input */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To:</span>
            <input
              type="date"
              value={endDate}
              max={todayStr}
              onChange={(e) => {
                const val = e.target.value;
                if (!val || val <= todayStr) {
                  setEndDate(val);
                } else {
                  setEndDate(todayStr);
                }
              }}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
              title="End Date (up to today)"
            />
          </div>

          {/* Reset Date Filter Button */}
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px] transition-colors cursor-pointer"
              title="Reset date filter"
            >
              <X className="w-3 h-3" />
              <span>Clear Dates</span>
            </button>
          )}
        </div>

        {/* Quick Date Shortcuts (Months, Days, Years) */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 flex-wrap self-start sm:self-auto">
          <span className="text-slate-400 mr-0.5">Quick:</span>
          <button
            type="button"
            onClick={() => handleSetQuickRange('this-month')}
            className="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => handleSetQuickRange('last-month')}
            className="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            Last Month
          </button>
          <button
            type="button"
            onClick={() => handleSetQuickRange('last-30')}
            className="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={() => handleSetQuickRange('this-year')}
            className="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            This Year
          </button>
          <button
            type="button"
            onClick={() => handleSetQuickRange('all')}
            className="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            All
          </button>
        </div>
      </div>

      {/* Transactions Table with Distinct Light Grey column headers */}
      {filteredTransactions.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
            <Inbox className="w-5 h-5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-700">No transactions found</h3>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-0.5">
            {searchTerm || typeFilter !== 'All'
              ? 'Try adjusting your search query or filters.'
              : 'Add your first transaction above to start tracking!'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Bulk Action Bar (Visible when 1+ transactions are selected) */}
          {selectedTransactions.length > 0 && (
            <div className="mx-3.5 sm:mx-4 my-2.5 p-3 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white shadow-lg shadow-purple-900/20 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
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

          <table className="w-full min-w-[620px] sm:min-w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-200/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                <th className="py-2.5 px-3 w-[46px] text-center whitespace-nowrap">
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
                <th className="py-2.5 px-3 sm:px-4 w-[110px] sm:w-[125px] whitespace-nowrap">Date</th>
                <th className="py-2.5 px-3 sm:px-4 w-[170px] sm:w-[200px]">Type &amp; Category</th>
                <th className="py-2.5 px-3 sm:px-4 min-w-[200px]">NOTES &amp; STOCK DETAILS</th>
                <th className="py-2.5 px-3 sm:px-4 w-[160px] sm:w-[185px]">Bill Attachments</th>
                <th className="py-2.5 px-3 sm:px-4 w-[130px] sm:w-[150px] text-right whitespace-nowrap">Amount (₹ INR)</th>
                <th className="py-2.5 px-2 sm:px-3 text-center w-[76px] sm:w-[84px] whitespace-nowrap">Actions</th>
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
                    <td className="py-2.5 px-3 w-[46px] text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select transaction ${tx.id}`}
                        checked={isSelected}
                        onChange={() => toggleSelectTx(tx.id)}
                        className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer accent-purple-600"
                      />
                    </td>
                    {/* Date */}
                    <td className="py-2.5 px-3 sm:px-4 text-xs text-slate-600 font-mono whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{tx.date}</span>
                      </div>
                    </td>

                    {/* Category & Badge */}
                    <td className="py-2.5 px-3 sm:px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownLeft className="w-3 h-3" />
                          )}
                        </span>
                        <div>
                          <p className="font-bold text-slate-800 text-xs sm:text-sm">
                            {tx.category}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                isIncome
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {tx.type}
                            </span>
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
                        </div>
                      </div>
                    </td>

                    {/* NOTES & STOCK DETAILS */}
                    <td className="py-2.5 px-3 sm:px-4 text-xs text-slate-600">
                      <div className="flex flex-col gap-0.5">
                        <span className="break-words line-clamp-2">{tx.note || <span className="text-slate-300 italic">None</span>}</span>
                      </div>
                    </td>

                    {/* Bill Attachments (Multiple supported with popup preview) */}
                    <td className="py-2.5 px-3 sm:px-4 w-[160px] sm:w-[185px]">
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
                    <td className="py-2.5 px-3 sm:px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-extrabold font-mono text-xs sm:text-sm tracking-tight ${
                          isIncome ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatINR(tx.amount)}
                      </span>
                    </td>

                    {/* Action buttons (Edit & Delete) */}
                    <td className="py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">
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

      {/* Attachment Preview Modal */}
      <AttachmentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        attachments={previewAttachments}
        initialIndex={previewIndex}
        txId={previewTxId}
        signature={previewSignature}
      />

      {/* Edit Transaction Modal */}
      {editingTx && onEditTransaction && (
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
