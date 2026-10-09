import React, { useState } from 'react';
import { 
  X, 
  Package, 
  Store, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  Loader2, 
  ShieldAlert,
  Info
} from 'lucide-react';

export type CatalogType = 'item' | 'seller';

interface MasterCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: CatalogType;
  items: string[];
  sellers: string[];
  onAddItem: (name: string) => Promise<void>;
  onDeleteItem: (name: string) => Promise<void>;
  onAddSeller: (name: string) => Promise<void>;
  onDeleteSeller: (name: string) => Promise<void>;
  isAdmin: boolean;
  onSelectValue?: (type: CatalogType, value: string) => void;
}

export const MasterCatalogModal: React.FC<MasterCatalogModalProps> = ({
  isOpen,
  onClose,
  initialType = 'item',
  items,
  sellers,
  onAddItem,
  onDeleteItem,
  onAddSeller,
  onDeleteSeller,
  isAdmin,
  onSelectValue,
}) => {
  const [activeTab, setActiveTab] = useState<CatalogType>(initialType);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Deletion confirmation state
  const [pendingDelete, setPendingDelete] = useState<{
    type: CatalogType;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync tab with initialType when opened
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialType);
      setNewName('');
      setError(null);
      setSuccess(null);
      setPendingDelete(null);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const currentList = activeTab === 'item' ? items : sellers;
  const isItem = activeTab === 'item';
  const entityLabel = isItem ? 'Item' : 'Seller';
  const sheetTabName = isItem ? 'Items' : 'Sellers';

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const clean = newName.trim();
    if (!clean) {
      setError(`Please enter a valid ${entityLabel.toLowerCase()} name.`);
      return;
    }

    // Duplicate check (case-insensitive)
    const exists = currentList.some(
      (entry) => entry.trim().toLowerCase() === clean.toLowerCase()
    );
    if (exists) {
      setError(`"${clean}" already exists in the ${entityLabel.toLowerCase()} master catalog.`);
      return;
    }

    if (!isAdmin) {
      setError('Only Admin users are permitted to add new master catalog entries.');
      return;
    }

    setIsSaving(true);
    try {
      if (isItem) {
        await onAddItem(clean);
      } else {
        await onAddSeller(clean);
      }

      setSuccess(`"${clean}" added to master catalog successfully.`);
      setNewName('');

      // Auto-select in form dropdown
      if (onSelectValue) {
        onSelectValue(activeTab, clean);
      }
    } catch (err) {
      setError((err as Error).message || `Failed to add ${entityLabel.toLowerCase()}.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;

    if (!isAdmin) {
      setError('Only Admin users are permitted to delete master catalog values.');
      setPendingDelete(null);
      return;
    }

    setError(null);
    setSuccess(null);
    setIsDeleting(true);

    try {
      if (pendingDelete.type === 'item') {
        await onDeleteItem(pendingDelete.name);
      } else {
        await onDeleteSeller(pendingDelete.name);
      }

      setSuccess(
        `"${pendingDelete.name}" removed from future dropdowns. All historical transactions remain intact.`
      );
      setPendingDelete(null);
    } catch (err) {
      setError((err as Error).message || `Failed to delete ${entityLabel.toLowerCase()}.`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-6 overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
              isItem ? 'bg-purple-600' : 'bg-indigo-600'
            }`}>
              {isItem ? <Package className="w-4 h-4" /> : <Store className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Manage Stock {isItem ? 'Items' : 'Sellers'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Master catalog entries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Items vs Sellers */}
        <div className="px-5 pt-3 pb-1 border-b border-slate-100 bg-white">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('item');
                setError(null);
                setSuccess(null);
                setPendingDelete(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'item'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Items ({items.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('seller');
                setError(null);
                setSuccess(null);
                setPendingDelete(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'seller'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Sellers ({sellers.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Notifications */}
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <p className="flex-1 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="flex-1 font-medium">{success}</p>
            </div>
          )}

          {/* Non-Admin Notice */}
          {!isAdmin && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Admin Permissions Required</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Only Admins can add or delete master catalog {entityLabel.toLowerCase()}s. You can view the currently active list below.
                </p>
              </div>
            </div>
          )}

          {/* Add Form (Only active for Admins) */}
          {isAdmin ? (
            <form onSubmit={handleAdd} className="space-y-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Add New {entityLabel}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    isItem
                      ? 'e.g. Wooden Puzzles, Building Blocks...'
                      : 'e.g. Toys Wholesaler Ltd, Mumbai...'
                  }
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={isSaving}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
                <button
                  type="submit"
                  disabled={isSaving || !newName.trim()}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs text-white shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors ${
                    isItem
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Add / Save</span>
                </button>
              </div>
            </form>
          ) : null}

          {/* Deletion Confirmation Banner */}
          {pendingDelete && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 space-y-2.5 animate-in fade-in zoom-in-95">
              <div className="flex items-start gap-2">
                <Trash2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">
                    Are you sure you want to delete this {pendingDelete.type === 'item' ? 'Item' : 'Seller'}?
                  </p>
                  <p className="text-xs font-semibold text-rose-800 mt-0.5">
                    &ldquo;{pendingDelete.name}&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    It will be removed from future transaction choices. Historical transaction records remain completely untouched.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPendingDelete(null)}
                  disabled={isDeleting}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Yes, Delete'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* List of current values */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Active Master {isItem ? 'Items' : 'Sellers'} ({currentList.length})
              </span>
            </div>

            {currentList.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No {entityLabel.toLowerCase()}s found. Add your first {entityLabel.toLowerCase()} above.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200/90 bg-white overflow-hidden">
                {currentList.map((entry, idx) => (
                  <li
                    key={`${entry}-${idx}`}
                    className="px-3 py-2 flex items-center justify-between hover:bg-slate-50/70 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {entry}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPendingDelete({
                              type: activeTab,
                              name: entry,
                            });
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title={`Delete ${entityLabel}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded">
                          Active
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Historical Safety Note */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px]">
            <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
            <p>
              <strong>Historical Data Safe:</strong> Deleting an item or seller only removes it from future dropdowns. All past transaction records remain preserved and untouched.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
