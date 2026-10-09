import React, { useState, useEffect, useRef } from 'react';
import { 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Tag, 
  IndianRupee, 
  FileText, 
  Loader2,
  CheckCircle2,
  Package,
  Store,
  Plus,
  Paperclip,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CategoriesData, TransactionType, BillAttachment } from '../types';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';
import { compressImageAttachment } from '../services/attachmentStore';

interface TransactionFormProps {
  categories: CategoriesData;
  items: string[];
  sellers: string[];
  onOpenMasterModal: (type: 'item' | 'seller') => void;
  onSubmit: (tx: {
    date: string;
    type: TransactionType;
    category: string;
    amount: number;
    note: string;
    item?: string;
    sellerDetails?: string;
    attachment?: BillAttachment;
    attachments?: BillAttachment[];
  }) => Promise<void>;
  isLoading: boolean;
  selectedItem?: string;
  selectedSeller?: string;
}

const QUICK_AMOUNTS_INR = [100, 500, 1000, 2000, 5000];

// Today's date string in local time YYYY-MM-DD
const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const TransactionForm: React.FC<TransactionFormProps> = ({
  categories,
  items,
  sellers,
  onOpenMasterModal,
  onSubmit,
  isLoading,
  selectedItem,
  selectedSeller,
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [justSubmitted, setJustSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewIndex, setPreviewIndex] = useState<number>(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        const compressed = await compressImageAttachment(file);
        setAttachments((prev) => [...prev, compressed]);
      } catch (err) {
        console.warn('File processing error:', err);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const currentOptions = type === 'Income' ? categories.income : categories.expense;
  const isStockPurchased = category.trim().toLowerCase() === 'stock purchased';

  // Automatically sync external item selection (e.g. freshly created item)
  useEffect(() => {
    if (selectedItem && items.includes(selectedItem)) {
      setItem(selectedItem);
    }
  }, [selectedItem, items]);

  // Automatically sync external seller selection (e.g. freshly created seller)
  useEffect(() => {
    if (selectedSeller && sellers.includes(selectedSeller)) {
      setSellerDetails(selectedSeller);
    }
  }, [selectedSeller, sellers]);

  // If selected item was deleted, clear selection
  useEffect(() => {
    if (item && !items.includes(item)) {
      setItem('');
    }
  }, [items, item]);

  // If selected seller was deleted, clear selection
  useEffect(() => {
    if (sellerDetails && !sellers.includes(sellerDetails)) {
      setSellerDetails('');
    }
  }, [sellers, sellerDetails]);

  // Automatically clear Item and Seller Details when Category changes away from Stock Purchased
  useEffect(() => {
    if (!isStockPurchased) {
      setItem('');
      setSellerDetails('');
    }
  }, [isStockPurchased]);

  useEffect(() => {
    if (currentOptions.length > 0) {
      if (!currentOptions.includes(category)) {
        setCategory(currentOptions[0]);
      }
    } else {
      setCategory('General');
    }
  }, [type, currentOptions, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isLoading) return;
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

    // Strictly enforce present/past dates only
    if (date > todayStr) {
      setFormError('Future dates are not allowed. Entries can only be recorded up to today.');
      return;
    }

    // If Stock Purchased, ensure item and seller details are selected
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

    const submissionPayload = {
      date: date || todayStr,
      type,
      category,
      amount: parsedAmount,
      note: note.trim(),
      item: isStockPurchased ? item : '',
      sellerDetails: isStockPurchased ? sellerDetails : '',
      attachment: attachments[0] || undefined,
      attachments: [...attachments],
    };

    // Instant local reset for immediate user responsiveness
    setAmount('');
    setNote('');
    setItem('');
    setSellerDetails('');
    setAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 2200);

    try {
      confetti({
        particleCount: 45,
        spread: 55,
        origin: { y: 0.8 },
        colors: type === 'Income' ? ['#10b981', '#38beff', '#ffa133'] : ['#fa1f7c', '#a855f7', '#ff6b00']
      });
    } catch {
      // Confetti is optional visual flair
    }

    setIsSubmitting(true);
    try {
      await onSubmit(submissionPayload);
    } catch (err) {
      setFormError((err as Error).message || 'Failed to submit transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAddAmount = (addValue: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + addValue).toFixed(0));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between h-full">
      {/* Compact Card Header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              New Transaction
            </h2>
            <p className="text-[11px] text-slate-500">
              Record business income & expenses
            </p>
          </div>
        </div>

        {justSubmitted && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Saved!
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-3">
          {/* Type Selector (Expense vs Income) */}
          <div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('Expense')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer ${
                  type === 'Expense'
                    ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs ring-2 ring-rose-500/20'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowDownLeft className={`w-3.5 h-3.5 ${type === 'Expense' ? 'text-rose-600' : 'text-slate-400'}`} />
                <span>Expense</span>
              </button>

              <button
                type="button"
                onClick={() => setType('Income')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer ${
                  type === 'Income'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowUpRight className={`w-3.5 h-3.5 ${type === 'Income' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Income</span>
              </button>
            </div>
          </div>

          {/* Date & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Date */}
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
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val > todayStr) {
                      setDate(todayStr);
                    } else {
                      setDate(val);
                    }
                  }}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>
            </div>

            {/* Dynamic Category based on Type */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Category
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none cursor-pointer"
                >
                  {currentOptions.length > 0 ? (
                    currentOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))
                  ) : (
                    <option value="General">General</option>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <svg className="fill-current h-3.5 w-3.5" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Item & Seller Details Grid (Appears only when Category is "Stock Purchased") */}
          {isStockPurchased && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
              {/* 1. Item Dropdown Field */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                  <span>Item</span>
                  <span className="text-[10px] font-semibold text-purple-600">Stock</span>
                </label>
                <div className="relative">
                  <Package className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    required
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Select Item</option>
                    {items.map((it) => (
                      <option key={it} value={it}>
                        {it}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                    <svg className="fill-current h-3.5 w-3.5" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
                {/* Clickable Add Item option below dropdown */}
                <div className="flex items-center justify-between mt-1 px-0.5">
                  <button
                    type="button"
                    onClick={() => onOpenMasterModal('item')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer group"
                  >
                    <Plus className="w-3 h-3 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <span>Add Item</span>
                  </button>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>

              {/* 2. Seller Details Dropdown Field */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                  <span>Seller Details</span>
                  <span className="text-[10px] font-semibold text-indigo-600">Supplier</span>
                </label>
                <div className="relative">
                  <Store className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    required
                    value={sellerDetails}
                    onChange={(e) => setSellerDetails(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Select Seller Details</option>
                    {sellers.map((seller) => (
                      <option key={seller} value={seller}>
                        {seller}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                    <svg className="fill-current h-3.5 w-3.5" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
                {/* Clickable Add Seller option below dropdown */}
                <div className="flex items-center justify-between mt-1 px-0.5">
                  <button
                    type="button"
                    onClick={() => onOpenMasterModal('seller')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer group"
                  >
                    <Plus className="w-3 h-3 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <span>Add Seller</span>
                  </button>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {sellers.length} {sellers.length === 1 ? 'seller' : 'sellers'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Amount in INR */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
              <span>Amount (₹ INR)</span>
              <span className="text-[10px] font-semibold text-indigo-600">Indian Rupee</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 flex items-center">
                <IndianRupee className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="number"
                step="1"
                min="1"
                required
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-base font-bold text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-300"
              />
            </div>

            {/* Quick amount presets */}
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Quick:</span>
              {QUICK_AMOUNTS_INR.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  +₹{val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
            </div>
          </div>

          {/* Note / Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Note <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. Toddler toys, inventory, supplies, utilities..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Bill Attachments (Multiple files supported) */}
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
                  onClick={() => {
                    setAttachments([]);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
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
              id="tx-bill-attachment"
            />

            {attachments.length === 0 ? (
              <label
                htmlFor="tx-bill-attachment"
                className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                title="Add attachments for bills in any format"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 group-hover:text-indigo-700">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Attach Bill</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  Add one or more files
                </span>
              </label>
            ) : (
              <div className="space-y-1.5">
                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-0.5">
                  {attachments.map((att, idx) => {
                    const isImg = att.dataUrl && (att.type.startsWith('image/') || att.name.match(/\.(jpg|jpeg|png|webp|gif)$/i));
                    return (
                      <div
                        key={att.id || idx}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-indigo-50/90 border border-indigo-200 text-xs animate-in fade-in"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewIndex(idx);
                            setPreviewModalOpen(true);
                          }}
                          className="flex items-center gap-2 min-w-0 cursor-pointer text-left group flex-1"
                          title="Click to preview bill"
                        >
                          {isImg ? (
                            <img
                              src={att.dataUrl}
                              alt={att.name}
                              className="w-7 h-7 rounded-md object-cover border border-indigo-300 shrink-0 group-hover:scale-105 transition-transform bg-white"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:bg-indigo-700 transition-colors">
                              <Paperclip className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-800 truncate text-[11px] leading-tight group-hover:text-indigo-700">
                              {att.name}
                            </p>
                            <p className="text-[9px] text-slate-500">
                              {(att.size / 1024).toFixed(1)} KB • <span className="text-indigo-600 font-semibold underline">Preview</span>
                            </p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer shrink-0 ml-1"
                          title="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add more button */}
                <label
                  htmlFor="tx-bill-attachment"
                  className="flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50 text-[11px] font-semibold text-indigo-700 transition-colors cursor-pointer"
                >
                  <Paperclip className="w-3 h-3 text-indigo-600" />
                  <span>Add More Files</span>
                </label>
              </div>
            )}
          </div>

          {formError && (
            <p className="text-[11px] text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
              {formError}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              type === 'Income'
                ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 ring-2 ring-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 ring-2 ring-rose-500/20'
            } disabled:opacity-50`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving transaction...
              </>
            ) : justSubmitted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                Saved Entry Successfully!
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Save {type} Entry
              </>
            )}
          </button>
        </div>
      </form>

      {/* Attachment Preview Modal */}
      <AttachmentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        attachments={attachments}
        initialIndex={previewIndex}
      />
    </div>
  );
};
