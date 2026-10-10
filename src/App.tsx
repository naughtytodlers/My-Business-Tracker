/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { ChartsSection } from './components/ChartsSection';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { ConnectionModal } from './components/ConnectionModal';
import { AppsScriptModal } from './components/AppsScriptModal';
import { SingleFileExportModal } from './components/SingleFileExportModal';
import { LoginScreen } from './components/LoginScreen';
import { UserManagementModal } from './components/UserManagementModal';
import { MasterCatalogModal, CatalogType } from './components/MasterCatalogModal';
import { 
  getSavedScriptUrl, 
  saveScriptUrl, 
  initScriptUrlConfig,
  fetchSheetData, 
  saveTransaction,
  updateTransactionInSheet,
  deleteTransactionFromSheet,
  bulkDeleteTransactionsFromSheet,
  bulkUpdateTransactionsInSheet,
  getCachedLocalTransactions,
  setCachedLocalTransactions,
  getCachedItems,
  getCachedSellers,
  saveItemToSheet,
  deleteItemFromSheet,
  saveSellerToSheet,
  deleteSellerFromSheet,
  hydrateTransactionsWithAttachments,
  deduplicateSheetInBackend
} from './services/sheetService';
import { getCurrentUser, logoutUser } from './services/authService';
import { CategoriesData, Transaction, TransactionType, AuthUser, BillAttachment } from './types';
import { DEFAULT_CATEGORIES, INITIAL_DEMO_TRANSACTIONS } from './constants';
import { AlertCircle, AlertTriangle, Code2, Sparkles, X, Trash2 } from 'lucide-react';
import { CuteToyTrain } from './components/CuteToyTrain';
import { FullTransactionsView } from './components/FullTransactionsView';
import { ToyAirplane, RockingHorseToy, MechanicalGearToy, PinwheelToy } from './components/PlayfulToysAmbient';

export default function App() {
  // Authentication & Access Control
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [isUserManagementOpen, setIsUserManagementOpen] = useState<boolean>(false);
  const [showWelcomeToast, setShowWelcomeToast] = useState<boolean>(false);

  const [scriptUrl, setScriptUrl] = useState<string>(getSavedScriptUrl());
  const [categories, setCategories] = useState<CategoriesData>(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>(() => getCachedLocalTransactions());
  const [items, setItems] = useState<string[]>(() => getCachedItems());
  const [sellers, setSellers] = useState<string[]>(() => getCachedSellers());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!getSavedScriptUrl());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const isSavingRef = useRef<boolean>(false);
  const recentAddedTxIds = useRef<Map<string, number>>(new Map());
  const [syncError, setSyncError] = useState<string | null>(null);

  // Modals
  const [isConnectionOpen, setIsConnectionOpen] = useState<boolean>(false);
  const [isAppsScriptOpen, setIsAppsScriptOpen] = useState<boolean>(false);
  const [isExportHtmlOpen, setIsExportHtmlOpen] = useState<boolean>(false);
  const [isMasterCatalogOpen, setIsMasterCatalogOpen] = useState<boolean>(false);
  const [masterCatalogType, setMasterCatalogType] = useState<CatalogType>('item');
  const [autoSelectedItem, setAutoSelectedItem] = useState<string>('');
  const [autoSelectedSeller, setAutoSelectedSeller] = useState<string>('');

  // Full Transactions View in New Tab or Separate View
  const [isFullView, setIsFullView] = useState<boolean>(() => {
    try {
      return (
        window.location.hash === '#/transactions-full' ||
        new URLSearchParams(window.location.search).get('view') === 'transactions'
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleHash = () => {
      try {
        setIsFullView(
          window.location.hash === '#/transactions-full' ||
          new URLSearchParams(window.location.search).get('view') === 'transactions'
        );
      } catch {}
    };
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
    };
  }, []);

  const [backendVersion, setBackendVersion] = useState<string>('2.2');
  const [showOutdatedScriptBanner, setShowOutdatedScriptBanner] = useState<boolean>(false);

  // Load data from Google Apps Script with Smart Merge
  const loadData = useCallback(async (urlToUse: string) => {
    if (!urlToUse) {
      setIsDemoMode(true);
      return;
    }

    // Never interrupt active transaction saving!
    if (isSavingRef.current) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await fetchSheetData(urlToUse);
      setCategories(result.categories);

      // Smart Merge: NEVER wipe out transactions that were recently added in this session!
      setTransactions((prev) => {
        const now = Date.now();
        const existingIds = new Set((result.transactions || []).map((t) => t.id));
        const existingSigs = new Set((result.transactions || []).map((t) =>
          `${t.date}_${t.type}_${t.category}_${t.amount}_${t.note}_${t.item || ''}_${t.sellerDetails || ''}`
        ));

        // Preserve any recent transactions added in the last 150 seconds that haven't propagated in getData yet
        const pendingLocals = prev.filter((t) => {
          const addedAt = recentAddedTxIds.current.get(t.id);
          const isRecent = addedAt ? (now - addedAt < 150000) : false;
          if (!isRecent) return false;
          const sig = `${t.date}_${t.type}_${t.category}_${t.amount}_${t.note}_${t.item || ''}_${t.sellerDetails || ''}`;
          return !existingIds.has(t.id) && !existingSigs.has(sig);
        });

        const merged = [...pendingLocals, ...(result.transactions || [])];
        setCachedLocalTransactions(merged);
        return merged;
      });

      if (result.items) {
        setItems(result.items);
      }
      if (result.sellers) {
        setSellers(result.sellers);
      }
      setIsDemoMode(false);
      setSyncError(null);

      const v = result.backendVersion || '1.0';
      setBackendVersion(v);
      if (v < '2.2') {
        setShowOutdatedScriptBanner(true);
      } else {
        setShowOutdatedScriptBanner(false);
      }
      setIsDemoMode(false);
    } catch (err) {
      console.warn('Sync notice:', err);
      // Gracefully populate local cache so UI is never blank
      const local = getCachedLocalTransactions();
      const hydrated = await hydrateTransactionsWithAttachments(local);
      setTransactions(hydrated);
      setItems(getCachedItems());
      setSellers(getCachedSellers());
      setIsDemoMode(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check URL on first mount: load saved/configured URL automatically without popping up modals
  useEffect(() => {
    // Hydrate local cache with persistent attachments from IndexedDB
    hydrateTransactionsWithAttachments(getCachedLocalTransactions()).then((hydrated) => {
      setTransactions(hydrated);
    });

    initScriptUrlConfig().then((activeUrl) => {
      const url = activeUrl || getSavedScriptUrl();
      if (url) {
        setScriptUrl(url);
        setIsDemoMode(false);
        loadData(url);
      }
    });
  }, [loadData]);

  // Auto-sync items, sellers, and transactions from Google Sheet safely
  useEffect(() => {
    const handleFocus = () => {
      const activeUrl = scriptUrl || getSavedScriptUrl();
      if (activeUrl && !isLoading && !isSavingRef.current) {
        loadData(activeUrl);
      }
    };

    window.addEventListener('focus', handleFocus);
    const interval = setInterval(() => {
      const activeUrl = scriptUrl || getSavedScriptUrl();
      if (activeUrl && !isLoading && !isSavingRef.current && document.visibilityState === 'visible') {
        loadData(activeUrl);
      }
    }, 30000); // 30s auto-poll to pick up changes made directly in Google Sheets

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [scriptUrl, isLoading, loadData]);

  // Auto-dismiss welcome toast after 4.5 seconds
  useEffect(() => {
    if (showWelcomeToast) {
      const timer = setTimeout(() => {
        setShowWelcomeToast(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [showWelcomeToast]);

  const handleSaveUrl = async (newUrl: string): Promise<boolean> => {
    try {
      const result = await fetchSheetData(newUrl);
      saveScriptUrl(newUrl);
      setScriptUrl(newUrl);
      setCategories(result.categories);
      setTransactions(result.transactions);
      if (result.items) {
        setItems(result.items);
      }
      if (result.sellers) {
        setSellers(result.sellers);
      }
      setIsDemoMode(false);
      setSyncError(null);
      return true;
    } catch (err) {
      console.warn('Notice verifying script URL:', err);
      saveScriptUrl(newUrl);
      setScriptUrl(newUrl);
      return true;
    }
  };

  const handleUseDemo = () => {
    setIsDemoMode(true);
    setTransactions(INITIAL_DEMO_TRANSACTIONS);
    setCachedLocalTransactions(INITIAL_DEMO_TRANSACTIONS);
    setCategories(DEFAULT_CATEGORIES);
    setItems(getCachedItems());
    setSellers(getCachedSellers());
    setSyncError(null);
  };

  const handleAddItem = async (name: string) => {
    const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
    await saveItemToSheet(urlToUse, name);
    setItems(getCachedItems());
  };

  const handleDeleteItem = async (name: string) => {
    const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
    await deleteItemFromSheet(urlToUse, name);
    setItems(getCachedItems());
  };

  const handleAddSeller = async (name: string) => {
    const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
    await saveSellerToSheet(urlToUse, name);
    setSellers(getCachedSellers());
  };

  const handleDeleteSeller = async (name: string) => {
    const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
    await deleteSellerFromSheet(urlToUse, name);
    setSellers(getCachedSellers());
  };

  const handleOpenMasterModal = (type: CatalogType) => {
    setMasterCatalogType(type);
    setIsMasterCatalogOpen(true);
  };

  const handleAddTransaction = async (newTx: {
    date: string;
    type: TransactionType;
    category: string;
    amount: number;
    note: string;
    item?: string;
    sellerDetails?: string;
    attachment?: BillAttachment;
    attachments?: BillAttachment[];
  }) => {
    // Generate unified, stable transaction ID upfront
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const attachmentsList = newTx.attachments && newTx.attachments.length > 0
      ? newTx.attachments
      : (newTx.attachment ? [newTx.attachment] : []);

    const optimisticRecord: Transaction = {
      id: txId,
      timestamp: new Date().toISOString(),
      date: newTx.date,
      type: newTx.type,
      category: newTx.category,
      amount: Number(newTx.amount),
      note: newTx.note || '',
      item: newTx.item || '',
      sellerDetails: newTx.sellerDetails || '',
      attachment: attachmentsList[0] || undefined,
      attachments: attachmentsList,
    };

    // Track recently added transaction timestamp to guarantee it NEVER disappears
    recentAddedTxIds.current.set(txId, Date.now());

    // 1. Immediately update UI & local cache!
    setTransactions((prev) => [optimisticRecord, ...prev.filter((t) => t.id !== txId)]);
    const currentCached = getCachedLocalTransactions();
    setCachedLocalTransactions([optimisticRecord, ...currentCached.filter((t) => t.id !== txId)]);

    // 2. Mark active save in progress to lock out disruptive background refreshes
    isSavingRef.current = true;
    setIsSaving(true);

    try {
      const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
      if (urlToUse) {
        const saved = await saveTransaction(urlToUse, {
          ...newTx,
          id: txId,
          attachments: attachmentsList,
          attachment: attachmentsList[0],
        });

        setTransactions((prev) => {
          const exists = prev.some((t) => t.id === txId || t.id === saved.id);
          if (exists) {
            return prev.map((t) => (t.id === txId || t.id === saved.id ? saved : t));
          }
          return [saved, ...prev];
        });
      }
    } catch (err) {
      console.warn('Sync transaction to sheet notice:', err);
      // Even if network had an issue, transaction remains safely stored in local state and cache!
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleEditTransaction = async (updatedTx: Transaction) => {
    try {
      const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
      await updateTransactionInSheet(urlToUse, updatedTx);
      setTransactions((prev) => {
        const next = prev.map((t) => (t.id === updatedTx.id ? updatedTx : t));
        setCachedLocalTransactions(next);
        return next;
      });
    } catch (err) {
      console.error('Error updating transaction', err);
      throw err;
    }
  };

  const handleDeleteTransaction = async (
    txId: string,
    rowNumber?: number,
    txDetails?: Partial<Transaction>
  ) => {
    try {
      const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
      await deleteTransactionFromSheet(urlToUse, txId, rowNumber, txDetails);
      setTransactions((prev) => {
        const next = prev.filter((t) => t.id !== txId);
        setCachedLocalTransactions(next);
        return next;
      });
    } catch (err) {
      console.error('Error deleting transaction', err);
      throw err;
    }
  };

  const handleBulkDeleteTransactions = async (
    txsToDelete: Transaction[],
    onProgress?: (done: number, total: number) => void
  ) => {
    try {
      const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
      await bulkDeleteTransactionsFromSheet(urlToUse, txsToDelete, onProgress);
      const deletedIds = new Set(txsToDelete.map((t) => t.id));
      setTransactions((prev) => {
        const next = prev.filter((t) => !deletedIds.has(t.id));
        setCachedLocalTransactions(next);
        return next;
      });
    } catch (err) {
      console.error('Error bulk deleting transactions', err);
      throw err;
    }
  };

  const handleBulkEditTransactions = async (
    updatedTxs: Transaction[],
    onProgress?: (done: number, total: number) => void
  ) => {
    try {
      const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
      await bulkUpdateTransactionsInSheet(urlToUse, updatedTxs, onProgress);
      const updateMap = new Map(updatedTxs.map((t) => [t.id, t]));
      setTransactions((prev) => {
        const next = prev.map((t) => updateMap.get(t.id) || t);
        setCachedLocalTransactions(next);
        return next;
      });
    } catch (err) {
      console.error('Error bulk updating transactions', err);
      throw err;
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  // Security Gate: Unauthenticated users MUST log in first
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setShowWelcomeToast(true);
          const activeUrl = scriptUrl || getSavedScriptUrl();
          if (activeUrl) {
            setIsDemoMode(false);
            loadData(activeUrl);
          }
        }}
      />
    );
  }

  // Full Transactions Tab View (dedicated tab/window or maximized view)
  if (isFullView) {
    return (
      <FullTransactionsView
        transactions={transactions}
        categories={categories}
        items={items}
        sellers={sellers}
        onBackToDashboard={() => {
          try {
            window.location.hash = '';
          } catch {}
          setIsFullView(false);
        }}
        onRefresh={() => loadData(scriptUrl)}
        isLoading={isLoading}
        onEditTransaction={handleEditTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        onBulkDeleteTransactions={handleBulkDeleteTransactions}
        onBulkEditTransactions={handleBulkEditTransactions}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col relative overflow-x-hidden animate-in fade-in duration-500 ease-out">
      {/* Pleasant Toy Airplane Flying Across the Ambient Sky */}
      <ToyAirplane />

      {/* Top Header with Role Badge & User controls */}
      <Header
        scriptUrl={scriptUrl}
        isDemoMode={isDemoMode}
        isLoading={isLoading}
        onRefresh={() => loadData(scriptUrl)}
        onOpenSettings={() => setIsConnectionOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onOpenAppsScript={() => setIsAppsScriptOpen(true)}
        onOpenExportHtml={() => setIsExportHtmlOpen(true)}
      />

      {/* Outdated Backend Script Notification Banner */}
      {showOutdatedScriptBanner && !isDemoMode && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 py-3 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold tracking-wide">Google Apps Script Update Recommended: </span>
              <span className="opacity-95">
                Your Google Sheet is running script {backendVersion}. To enable live transaction deletion and editing without creating duplicate rows, deploy the updated v2.2 script.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsAppsScriptOpen(true)}
              className="px-3 py-1.5 bg-white text-amber-900 font-extrabold rounded-xl shadow-xs hover:bg-amber-50 active:scale-95 transition-all text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Update Script (v2.2)</span>
            </button>
            <button
              type="button"
              onClick={() => setShowOutdatedScriptBanner(false)}
              className="p-1 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 w-full space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-600 ease-out">
        {/* Banner if connection error */}
        {syncError && !isDemoMode && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">Google Sheet Sync Notification</p>
                <p className="text-amber-800 text-[11px] mt-0.5">{syncError}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => loadData(scriptUrl)}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Retry
              </button>
              <button
                onClick={() => setIsConnectionOpen(true)}
                className="px-2.5 py-1 rounded-lg border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors cursor-pointer"
              >
                Configure URL
              </button>
            </div>
          </div>
        )}

        {/* 1. KPI Summary Cards */}
        <DashboardStats transactions={transactions} />

        {/* 2. Side-by-Side: Left = New Transaction, Right = Visual Diagrams & Charts */}
        <section aria-label="Operations & Analytics" className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
          {/* New Transaction Form (Placed where Income vs. Expense Ratio was) */}
          <div className="w-full flex flex-col">
            <TransactionForm
              categories={categories}
              items={items}
              sellers={sellers}
              onOpenMasterModal={handleOpenMasterModal}
              onSubmit={handleAddTransaction}
              isLoading={isSaving}
              selectedItem={autoSelectedItem}
              selectedSeller={autoSelectedSeller}
            />
          </div>

          {/* Visual Diagrams: Pie Diagram & Monthly Bar Graph */}
          <div className="w-full flex flex-col">
            <ChartsSection transactions={transactions} />
          </div>
        </section>

        {/* 3. Full-width Transaction History Table & Filters */}
        <section aria-label="Transaction History" className="w-full">
          <TransactionList
            transactions={transactions}
            categories={categories}
            items={items}
            sellers={sellers}
            onRefresh={() => loadData(scriptUrl)}
            isLoading={isLoading}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onBulkDeleteTransactions={handleBulkDeleteTransactions}
            onBulkEditTransactions={handleBulkEditTransactions}
            onOpenFullView={() => {
              try {
                window.location.hash = '#/transactions-full';
              } catch {}
              setIsFullView(true);
            }}
          />
        </section>
      </main>

      {/* Playful Kids Toys & Mechanical Toys vignette (Subtle, pleasant, non-intrusive) */}
      <div className="max-w-7xl mx-auto px-4 w-full mt-6 flex items-center justify-between text-slate-400 select-none pointer-events-none opacity-80 sm:opacity-90">
        <div className="flex items-center gap-3">
          <RockingHorseToy />
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Play • Learn • Grow • Smile</span>
            <span className="text-[9px] text-slate-400">Little Essentials for Brighter Tomorrows</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/80 border border-slate-200/70 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-600">Clockwork Toys &amp; Essentials</span>
          </div>
          <MechanicalGearToy />
        </div>
      </div>

      {/* Cute Toy Train Track at bottom of dashboard (subtle, playful, non-intrusive) */}
      <div id="toy-train-track-section" data-train-track="true" className="w-full mt-2 overflow-hidden opacity-90">
        <CuteToyTrain compact />
      </div>

      {/* Clean Brand Footer without technical URLs or links */}
      <footer className="border-t border-slate-200/80 bg-white py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-700">
            Naughty Toddlers • <span className="bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-600 bg-clip-text text-transparent font-black">My Business Tracker</span>
          </p>
          <p className="text-slate-400 text-[11px]">
            Keep your business transactions organized and up to date
          </p>
        </div>
      </footer>

      {/* Cute Welcome Celebration Toast on Login (non-intrusive) */}
      {showWelcomeToast && currentUser && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-purple-200 p-3.5 flex items-center gap-3 max-w-sm ring-1 ring-purple-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 text-white flex items-center justify-center text-lg shadow-xs animate-train-bob shrink-0">
              🚂
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-black text-slate-800 truncate">
                  Welcome aboard, {currentUser.name}!
                </p>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-sparkle-pulse shrink-0" />
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Business records ready & synchronized.
              </p>
            </div>
            <button
              onClick={() => setShowWelcomeToast(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg shrink-0 cursor-pointer"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Connection Setup Modal (Prompts user on first open or manual click) */}
      <ConnectionModal
        isOpen={isConnectionOpen}
        onClose={() => setIsConnectionOpen(false)}
        currentUrl={scriptUrl}
        onSaveUrl={handleSaveUrl}
        onUseDemo={handleUseDemo}
        onViewAppsScript={() => {
          setIsConnectionOpen(false);
          setIsAppsScriptOpen(true);
        }}
      />

      {/* Apps Script Guide & Code Modal */}
      <AppsScriptModal
        isOpen={isAppsScriptOpen}
        onClose={() => setIsAppsScriptOpen(false)}
      />

      {/* Single HTML Export Modal */}
      <SingleFileExportModal
        isOpen={isExportHtmlOpen}
        onClose={() => setIsExportHtmlOpen(false)}
      />

      {/* Admin User Management Modal */}
      {currentUser && (
        <UserManagementModal
          isOpen={isUserManagementOpen}
          onClose={() => setIsUserManagementOpen(false)}
          currentUser={currentUser}
          scriptUrl={scriptUrl}
        />
      )}

      {/* Master Items & Sellers Management Modal */}
      <MasterCatalogModal
        isOpen={isMasterCatalogOpen}
        onClose={() => setIsMasterCatalogOpen(false)}
        initialType={masterCatalogType}
        items={items}
        sellers={sellers}
        onAddItem={handleAddItem}
        onDeleteItem={handleDeleteItem}
        onAddSeller={handleAddSeller}
        onDeleteSeller={handleDeleteSeller}
        isAdmin={currentUser?.role === 'Admin'}
        onSelectValue={(type, val) => {
          if (type === 'item') {
            setAutoSelectedItem(val);
          } else {
            setAutoSelectedSeller(val);
          }
        }}
      />
    </div>
  );
}
