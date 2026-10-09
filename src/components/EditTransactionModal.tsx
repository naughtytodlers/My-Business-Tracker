import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Calendar, 
  Tag, 
  IndianRupee, 
  FileText, 
  Package, 
  Store, 
  Paperclip, 
  Loader2,
  Check,
  AlertCircle,
  Plus
} from 'lucide-react';
import { CategoriesData, Transaction, TransactionType, BillAttachment } from '../types';
import { getAttachmentsForTx, getTxSignature } from '../services/attachmentStore';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  categories: CategoriesData;
  items: string[];
  sellers: string[];
  onOpenMasterModal?: (type: 'item' | 'seller') => void;
  onSave: (updatedTx: Transaction) => Promise<void>;
}

// Today's date string in local time YYYY-MM-DD
const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  categories,
  items,
  sellers,
  onOpenMasterModal,
  onSave,
}) => {
  const todayStr = getTodayStr();

  const [type, setType] = useState<TransactionType>('Expense');
  const [date, setDate] = useState<string>(todayStr);
  const [category, setCategory] = useState<string>('');
  const [item, setItem] = useState<string>('');
  const [sellerDetails, setSellerDetails] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [attachments, setAttachments] = useState<BillAttachment[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Populate form when transaction changes
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setDate(transaction.date || todayStr);
      setCategory(transaction.category || '');
      setItem(transaction.item || '');
      setSellerDetails(transaction.sellerDetails || '');
      setAmount(String(transaction.amount || ''));
      setNote(transaction.note || '');
      
      const existingAtts: BillAttachment[] = transaction.attachments && transaction.attachments.length > 0
        ? [...transaction.attachments]
        : (transaction.attachment ? [transaction.attachment] : []);
      setAttachments(existingAtts);

      // Hydrate dataUrls from IndexedDB if not present
      if (existingAtts.some((a) => !a.dataUrl)) {
        getAttachmentsForTx(transaction.id, getTxSignature(transaction.date, transaction.amount, transaction.category)).then((stored) => {
          if (stored && stored.length > 0) {
            setAttachments((prev) =>
              prev.map((att, i) => {
                const match = stored[i] || stored.find((s) => s.name === att.name);
                return match && match.dataUrl ? { ...att, dataUrl: match.dataUrl } : att;
              })
            );
          }
        });
      }

      setFormError(null);
    }
  }, [transaction, todayStr]);

  if (!isOpen || !transaction) return null;

  const currentOptions = type === 'Income' ? categories.income : categories.expense;
  const isStockPurchased = category.trim().toLowerCase() === 'stock purchased';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachments((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            dataUrl: event.target?.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (idxToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!category) {
      setFormError('Please select a category.');
      return;
    }

    if (date > todayStr) {
      setFormError('Future dates are not allowed. Entries can only be recorded up to today.');
      return;
    }

    if (isStockPurchased) {
      if (!item) {
        setFormError('Please select an Item for Stock Purchased.');
        return;
      }
      if (!sellerDetails) {
        setFormError('Please select Seller Details for Stock Purchased.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const updatedTx: Transaction = {
        ...transaction,
        date,
        type,
        category,
        amount: parsedAmount,
        note: note.trim(),
        item: isStockPurchased ? item : '',
        sellerDetails: isStockPurchased ? sellerDetails : '',
        attachment: attachments[0] || undefined,
        attachments: attachments,
      };

      await onSave(updatedTx);
      onClose();
    } catch (err) {
      setFormError((err as Error).message || 'Failed to update transaction.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Edit Transaction</h2>
              <p className="text-xs text-slate-500 font-medium">
                Update date, category, amount, notes, or attachments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-3.5">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Type Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('Expense')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                  type === 'Expense'
                    ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('Income')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                  type === 'Income'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Date
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={date}
                  max={todayStr}
                  onChange={(e) => setDate(e.target.value > todayStr ? todayStr : e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Category
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white cursor-pointer"
                >
                  {currentOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stock Purchased Item & Seller */}
          {isStockPurchased && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-purple-50/50 border border-purple-200/60">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-purple-900 mb-1">
                  Item
                </label>
                <div className="relative">
                  <Package className="w-3.5 h-3.5 text-purple-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-purple-200 text-xs font-semibold text-slate-800 bg-white cursor-pointer"
                  >
                    <option value="">Select Item</option>
                    {items.map((it) => (
                      <option key={it} value={it}>{it}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-purple-900 mb-1">
                  Seller Details
                </label>
                <div className="relative">
                  <Store className="w-3.5 h-3.5 text-purple-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={sellerDetails}
                    onChange={(e) => setSellerDetails(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-purple-200 text-xs font-semibold text-slate-800 bg-white cursor-pointer"
                  >
                    <option value="">Select Seller</option>
                    {sellers.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Amount (₹ INR)
            </label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="number"
                step="1"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8.5 pr-3 py-2 rounded-xl border border-slate-200 text-base font-bold font-mono text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Note (optional)
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Description or remarks..."
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white"
              />
            </div>
          </div>

          {/* Multiple Bill Attachments */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <span>Bill Attachments</span>
                <span className="text-[10px] font-normal text-slate-400">
                  {attachments.length > 0 ? `(${attachments.length} attached)` : '(optional)'}
                </span>
              </label>
              {attachments.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAttachments([])}
                  className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="edit-tx-attachment"
            />

            {attachments.length === 0 ? (
              <label
                htmlFor="edit-tx-attachment"
                className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 group-hover:text-indigo-700">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Attach Bill</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  Add files
                </span>
              </label>
            ) : (
              <div className="space-y-1.5">
                <div className="max-h-28 overflow-y-auto space-y-1 pr-0.5">
                  {attachments.map((att, idx) => (
                    <div
                      key={att.id || idx}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-indigo-50/80 border border-indigo-200 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {att.dataUrl && (att.type.startsWith('image/') || att.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)) ? (
                          <img
                            src={att.dataUrl}
                            alt={att.name}
                            className="w-7 h-7 rounded-md object-cover border border-indigo-300 shrink-0 bg-white"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0">
                            <Paperclip className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate text-[11px] leading-tight">
                            {att.name}
                          </p>
                          <p className="text-[9px] text-slate-500">
                            {(att.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <label
                  htmlFor="edit-tx-attachment"
                  className="flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50 text-[11px] font-semibold text-indigo-700 transition-colors cursor-pointer"
                >
                  <Paperclip className="w-3 h-3 text-indigo-600" />
                  <span>Add More Files</span>
                </label>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
