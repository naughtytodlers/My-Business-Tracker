import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  AlertTriangle, 
  Loader2, 
  Calendar,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { Transaction } from '../types';
import { formatINR } from '../utils/currency';

interface BulkDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTransactions: Transaction[];
  onConfirmDelete: (txs: Transaction[], onProgress?: (done: number, total: number) => void) => Promise<void>;
}

export const BulkDeleteConfirmModal: React.FC<BulkDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  selectedTransactions,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || selectedTransactions.length === 0) return null;

  const totalCount = selectedTransactions.length;
  const incomeTxs = selectedTransactions.filter((t) => t.type === 'Income');
  const expenseTxs = selectedTransactions.filter((t) => t.type === 'Expense');

  const totalIncome = incomeTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalExpense = expenseTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const netAmount = totalIncome - totalExpense;

  const handleDelete = async () => {
    setErrorMsg(null);
    setIsDeleting(true);
    setProgress({ done: 0, total: totalCount });

    try {
      await onConfirmDelete(selectedTransactions, (done, total) => {
        setProgress({ done, total });
      });
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message || 'Failed to delete selected transactions.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full my-6 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-rose-100 bg-gradient-to-r from-rose-50 via-pink-50/50 to-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm shadow-rose-600/30 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                Delete Selected Transactions
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Permanently remove <strong className="text-rose-700">{totalCount}</strong> records from Google Sheet &amp; Dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Warning banner */}
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-xs text-rose-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <p className="font-bold">Are you sure you want to delete these {totalCount} transactions?</p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                This action will delete them from your records. Dashboard metrics and charts will recalculate automatically.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-xs text-rose-800 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Breakdown Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Records</span>
              <span className="text-sm font-black text-slate-800">{totalCount}</span>
            </div>
            {incomeTxs.length > 0 && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Income ({incomeTxs.length})</span>
                <span className="text-xs font-black text-emerald-700">{formatINR(totalIncome, { showDecimals: false })}</span>
              </div>
            )}
            {expenseTxs.length > 0 && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-[10px] uppercase font-bold text-rose-600 block">Expense ({expenseTxs.length})</span>
                <span className="text-xs font-black text-rose-700">-{formatINR(totalExpense, { showDecimals: false })}</span>
              </div>
            )}
          </div>

          {/* Compact List of Items Being Deleted */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              <span>Items to be deleted</span>
              <span>Showing up to 8 entries</span>
            </div>
            <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
              {selectedTransactions.slice(0, 8).map((tx) => (
                <div key={tx.id} className="p-2 px-3 flex items-center justify-between gap-2 text-xs hover:bg-white transition-colors">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">{tx.date}</span>
                    <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      tx.type === 'Income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {tx.type === 'Income' ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <ArrowDownLeft className="w-2.5 h-2.5 mr-0.5" />}
                      {tx.category}
                    </span>
                    {tx.note && <span className="text-slate-400 text-[11px] truncate max-w-[140px]">{tx.note}</span>}
                  </div>
                  <span className={`font-mono font-bold text-[11px] shrink-0 ${
                    tx.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {tx.type === 'Income' ? '+' : '-'}{formatINR(tx.amount, { showDecimals: false })}
                  </span>
                </div>
              ))}
              {selectedTransactions.length > 8 && (
                <div className="p-2 text-center text-[11px] text-slate-500 font-medium bg-slate-100/60">
                  +{selectedTransactions.length - 8} more transactions...
                </div>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          {progress && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                <span>Deleting records...</span>
                <span>{progress.done} of {progress.total}</span>
              </div>
              <div className="w-full bg-rose-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-rose-600 h-full rounded-full transition-all duration-200"
                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting ({progress?.done || 0}/{totalCount})...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete {totalCount} Transactions</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
