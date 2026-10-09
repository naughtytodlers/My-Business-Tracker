import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Check, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  Tag, 
  FileText, 
  IndianRupee, 
  Package, 
  Store,
  Sparkles
} from 'lucide-react';
import { Transaction, CategoriesData, TransactionType } from '../types';
import { formatINR } from '../utils/currency';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTransactions: Transaction[];
  categories: CategoriesData;
  items: string[];
  sellers: string[];
  onApplyBulkEdit: (updatedTxs: Transaction[], onProgress?: (done: number, total: number) => void) => Promise<void>;
}

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  selectedTransactions,
  categories,
  items,
  sellers,
  onApplyBulkEdit,
}) => {
  const todayStr = getTodayStr();

  // Field toggles
  const [enableTypeCategory, setEnableTypeCategory] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType>('Expense');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [enableDate, setEnableDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [enableAmount, setEnableAmount] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<string>('');

  const [enableNote, setEnableNote] = useState(false);
  const [noteMode, setNoteMode] = useState<'replace' | 'append'>('append');
  const [selectedNote, setSelectedNote] = useState('');

  const [enableItem, setEnableItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');

  const [enableSeller, setEnableSeller] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState('');

  // Execution states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize defaults on open
  useEffect(() => {
    if (isOpen) {
      setEnableTypeCategory(false);
      setEnableDate(false);
      setEnableAmount(false);
      setEnableNote(false);
      setEnableItem(false);
      setEnableSeller(false);
      setSelectedDate(todayStr);
      setSelectedAmount('');
      setSelectedNote('');
      setSelectedItem('');
      setSelectedSeller('');
      setErrorMsg(null);
      setProgress(null);
      setIsSubmitting(false);

      // Default category to first expense category
      const firstExp = categories.expense[0] || 'General';
      setSelectedType('Expense');
      setSelectedCategory(firstExp);
    }
  }, [isOpen, categories, todayStr]);

  // Update selectedCategory when type changes
  useEffect(() => {
    const list = selectedType === 'Income' ? categories.income : categories.expense;
    if (list.length > 0 && !list.includes(selectedCategory)) {
      setSelectedCategory(list[0]);
    }
  }, [selectedType, categories, selectedCategory]);

  if (!isOpen || selectedTransactions.length === 0) return null;

  const totalAmount = selectedTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const isAnyFieldEnabled =
    enableTypeCategory || enableDate || enableAmount || enableNote || enableItem || enableSeller;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAnyFieldEnabled) {
      setErrorMsg('Please select at least one field to update.');
      return;
    }

    if (enableAmount) {
      const parsed = parseFloat(selectedAmount);
      if (isNaN(parsed) || parsed < 0) {
        setErrorMsg('Please enter a valid amount.');
        return;
      }
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    setProgress({ done: 0, total: selectedTransactions.length });

    try {
      const updatedTxs: Transaction[] = selectedTransactions.map((tx) => {
        const copy: Transaction = { ...tx };

        if (enableTypeCategory) {
          copy.type = selectedType;
          copy.category = selectedCategory || copy.category;
        }

        if (enableDate && selectedDate) {
          copy.date = selectedDate;
        }

        if (enableAmount && selectedAmount !== '') {
          copy.amount = parseFloat(selectedAmount);
        }

        if (enableNote) {
          if (noteMode === 'replace') {
            copy.note = selectedNote.trim();
          } else {
            const current = copy.note ? copy.note.trim() : '';
            copy.note = current ? `${current} • ${selectedNote.trim()}` : selectedNote.trim();
          }
        }

        if (enableItem) {
          copy.item = selectedItem.trim();
        }

        if (enableSeller) {
          copy.sellerDetails = selectedSeller.trim();
        }

        return copy;
      });

      await onApplyBulkEdit(updatedTxs, (done, total) => {
        setProgress({ done, total });
      });

      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message || 'Failed to apply bulk edit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full my-6 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 via-indigo-50/60 to-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm shadow-purple-600/30 shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                Bulk Edit Transactions
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Modifying <strong className="text-purple-700">{selectedTransactions.length}</strong> selected entries • Total {formatINR(totalAmount, { showDecimals: false })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Information Notice */}
          <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200/80 text-xs text-purple-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Check only the fields you want to batch update. Unchecked fields will keep their current individual values intact.
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMsg}</div>
            </div>
          )}

          {/* 1. Type & Category */}
          <div className={`p-3.5 rounded-xl border transition-all ${enableTypeCategory ? 'bg-purple-50/40 border-purple-300 ring-2 ring-purple-500/10' : 'bg-slate-50/80 border-slate-200'}`}>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableTypeCategory}
                onChange={(e) => setEnableTypeCategory(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
              />
              <Tag className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-slate-800">Update Type &amp; Category</span>
            </label>

            {enableTypeCategory && (
              <div className="mt-3 pl-6 space-y-2.5 animate-in fade-in duration-150">
                {/* Type Selection */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedType('Expense')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      selectedType === 'Expense'
                        ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs ring-1 ring-rose-400/30'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedType('Income')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      selectedType === 'Income'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs ring-1 ring-emerald-400/30'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Income
                  </button>
                </div>

                {/* Category Dropdown */}
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  >
                    {(selectedType === 'Income' ? categories.income : categories.expense).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 2. Date */}
          <div className={`p-3.5 rounded-xl border transition-all ${enableDate ? 'bg-purple-50/40 border-purple-300 ring-2 ring-purple-500/10' : 'bg-slate-50/80 border-slate-200'}`}>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableDate}
                onChange={(e) => setEnableDate(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
              />
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">Update Transaction Date</span>
            </label>

            {enableDate && (
              <div className="mt-3 pl-6 animate-in fade-in duration-150">
                <input
                  type="date"
                  max={todayStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
          </div>

          {/* 3. Amount (Optional) */}
          <div className={`p-3.5 rounded-xl border transition-all ${enableAmount ? 'bg-purple-50/40 border-purple-300 ring-2 ring-purple-500/10' : 'bg-slate-50/80 border-slate-200'}`}>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableAmount}
                onChange={(e) => setEnableAmount(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
              />
              <IndianRupee className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-800">Set Uniform Amount (₹)</span>
            </label>

            {enableAmount && (
              <div className="mt-3 pl-6 animate-in fade-in duration-150">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter amount to apply to all selected"
                  value={selectedAmount}
                  onChange={(e) => setSelectedAmount(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
          </div>

          {/* 4. Notes */}
          <div className={`p-3.5 rounded-xl border transition-all ${enableNote ? 'bg-purple-50/40 border-purple-300 ring-2 ring-purple-500/10' : 'bg-slate-50/80 border-slate-200'}`}>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableNote}
                onChange={(e) => setEnableNote(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
              />
              <FileText className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-800">Update Description / Notes</span>
            </label>

            {enableNote && (
              <div className="mt-3 pl-6 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="noteMode"
                      value="append"
                      checked={noteMode === 'append'}
                      onChange={() => setNoteMode('append')}
                      className="text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <span>Append to existing notes</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="noteMode"
                      value="replace"
                      checked={noteMode === 'replace'}
                      onChange={() => setNoteMode('replace')}
                      className="text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <span>Replace completely</span>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Note text to apply"
                  value={selectedNote}
                  onChange={(e) => setSelectedNote(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
          </div>

          {/* 5. Stock Item */}
          <div className={`p-3.5 rounded-xl border transition-all ${enableItem ? 'bg-purple-50/40 border-purple-300 ring-2 ring-purple-500/10' : 'bg-slate-50/80 border-slate-200'}`}>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableItem}
                onChange={(e) => setEnableItem(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
              />
              <Package className="w-4 h-4 text-pink-600" />
              <span className="text-xs font-bold text-slate-800">Update Stock Purchased Item</span>
            </label>

            {enableItem && (
              <div className="mt-3 pl-6 animate-in fade-in duration-150">
                <input
                  type="text"
                  list="bulk-items-list"
                  placeholder="Select or enter item name"
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
                <datalist id="bulk-items-list">
                  {items.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </div>
            )}
          </div>

          {/* 6. Seller Details */}
          <div className={`p-3.5 rounded-xl border transition-all ${enableSeller ? 'bg-purple-50/40 border-purple-300 ring-2 ring-purple-500/10' : 'bg-slate-50/80 border-slate-200'}`}>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableSeller}
                onChange={(e) => setEnableSeller(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
              />
              <Store className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-bold text-slate-800">Update Seller Details</span>
            </label>

            {enableSeller && (
              <div className="mt-3 pl-6 animate-in fade-in duration-150">
                <input
                  type="text"
                  list="bulk-sellers-list"
                  placeholder="Select or enter seller name"
                  value={selectedSeller}
                  onChange={(e) => setSelectedSeller(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
                <datalist id="bulk-sellers-list">
                  {sellers.map((seller) => (
                    <option key={seller} value={seller} />
                  ))}
                </datalist>
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          {progress && (
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                <span>Updating records...</span>
                <span>{progress.done} of {progress.total}</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all duration-200"
                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isAnyFieldEnabled || isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Applying Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply to {selectedTransactions.length} Transactions</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
