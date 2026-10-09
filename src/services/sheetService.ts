/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CategoriesData, SheetApiResponse, SheetUserRecord, Transaction, UserRole, BillAttachment } from '../types';
import { DEFAULT_CATEGORIES, INITIAL_DEMO_TRANSACTIONS, STOCK_PURCHASED_ITEMS, STOCK_PURCHASED_SELLERS, DEFAULT_APPS_SCRIPT_URL } from '../constants';
import { syncUsersFromSheet } from './authService';
import { 
  saveAttachmentsForTx, 
  getAttachmentsForTx, 
  getAllStoredAttachments, 
  deleteAttachmentsForTx, 
  getTxSignature,
  syncAttachmentToServer,
  fetchAllAttachmentsFromServer
} from './attachmentStore';

const SCRIPT_URL_KEY = 'google_apps_script_url';
const LOCAL_TX_KEY = 'local_transactions_cache';
const LOCAL_ITEMS_KEY = 'master_items_cache';
const LOCAL_SELLERS_KEY = 'master_sellers_cache';

// In-flight submission lock to prevent concurrent duplicate submissions
const inFlightSubmissions = new Set<string>();

// In-memory active script URL shared across modules
let activeScriptUrl = '';

/**
 * Initializes and retrieves the Google Apps Script URL across all devices & incognito mode.
 * Checks URL query parameters, server shared configuration (/api/config), localStorage, and constants.
 */
export async function initScriptUrlConfig(): Promise<string> {
  // 1. Check URL parameters for direct link sharing (e.g. ?scriptUrl=... or ?url=...)
  try {
    if (typeof window !== 'undefined' && window.location) {
      const searchParams = new URLSearchParams(window.location.search);
      let queryUrl = searchParams.get('scriptUrl') || searchParams.get('url');

      if (!queryUrl && window.location.hash.includes('scriptUrl=')) {
        const hashPart = window.location.hash.split('scriptUrl=')[1];
        if (hashPart) {
          queryUrl = decodeURIComponent(hashPart.split('&')[0]);
        }
      }

      if (queryUrl && queryUrl.startsWith('https://script.google.com/macros/s/')) {
        const clean = queryUrl.trim();
        activeScriptUrl = clean;
        saveScriptUrl(clean);
        // Clean URL in browser address bar without reload
        try {
          const cleanLocation = new URL(window.location.href);
          cleanLocation.searchParams.delete('scriptUrl');
          cleanLocation.searchParams.delete('url');
          window.history.replaceState({}, document.title, cleanLocation.toString());
        } catch {}
        return clean;
      }
    }
  } catch {}

  // 2. Fetch server-side shared configuration (/api/config) so any device/incognito session gets it
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data && data.scriptUrl && typeof data.scriptUrl === 'string' && data.scriptUrl.trim()) {
        const serverUrl = data.scriptUrl.trim();
        activeScriptUrl = serverUrl;
        try {
          localStorage.setItem(SCRIPT_URL_KEY, serverUrl);
        } catch {}
        return serverUrl;
      }
    }
  } catch {
    // Harmless fallback if running on static host like GitHub Pages
  }

  // 3. Fallback to localStorage
  try {
    const saved = localStorage.getItem(SCRIPT_URL_KEY);
    if (saved && saved.trim()) {
      activeScriptUrl = saved.trim();
      return activeScriptUrl;
    }
  } catch {}

  // 4. Fallback to built-in constants
  if (DEFAULT_APPS_SCRIPT_URL && DEFAULT_APPS_SCRIPT_URL.trim()) {
    activeScriptUrl = DEFAULT_APPS_SCRIPT_URL.trim();
    try {
      localStorage.setItem(SCRIPT_URL_KEY, activeScriptUrl);
    } catch {}
    return activeScriptUrl;
  }

  return activeScriptUrl;
}

export function getSavedScriptUrl(): string {
  if (activeScriptUrl && activeScriptUrl.trim()) {
    return activeScriptUrl.trim();
  }

  // Check URL query parameters
  try {
    if (typeof window !== 'undefined' && window.location) {
      const searchParams = new URLSearchParams(window.location.search);
      const queryUrl = searchParams.get('scriptUrl') || searchParams.get('url');
      if (queryUrl && queryUrl.startsWith('https://script.google.com/macros/s/')) {
        activeScriptUrl = queryUrl.trim();
        try {
          localStorage.setItem(SCRIPT_URL_KEY, activeScriptUrl);
        } catch {}
        return activeScriptUrl;
      }
    }
  } catch {}

  try {
    const saved = localStorage.getItem(SCRIPT_URL_KEY);
    if (saved && saved.trim()) {
      activeScriptUrl = saved.trim();
      return activeScriptUrl;
    }
    if (DEFAULT_APPS_SCRIPT_URL && DEFAULT_APPS_SCRIPT_URL.trim()) {
      activeScriptUrl = DEFAULT_APPS_SCRIPT_URL.trim();
      try {
        localStorage.setItem(SCRIPT_URL_KEY, activeScriptUrl);
      } catch {}
      return activeScriptUrl;
    }
    return '';
  } catch {
    return DEFAULT_APPS_SCRIPT_URL || '';
  }
}

export function saveScriptUrl(url: string): void {
  const clean = url.trim();
  activeScriptUrl = clean;
  try {
    localStorage.setItem(SCRIPT_URL_KEY, clean);
  } catch (e) {
    console.error('Failed to save script URL to localStorage', e);
  }

  // Asynchronously persist to server shared config (/api/config) so all devices & incognito inherit it
  if (clean) {
    try {
      fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptUrl: clean }),
      }).catch(() => {
        // Harmless on static hosts
      });
    } catch {}
  }
}

export function clearScriptUrl(): void {
  activeScriptUrl = '';
  try {
    localStorage.removeItem(SCRIPT_URL_KEY);
  } catch (e) {
    console.error('Failed to clear script URL', e);
  }
}

/**
 * Reads local cached transactions.
 */
export function getCachedLocalTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(LOCAL_TX_KEY);
    if (raw) {
      const parsed: Transaction[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read local cache', e);
  }
  // Only return initial demo transactions if no Google Apps Script backend is configured
  const url = getSavedScriptUrl();
  if (!url || url.trim() === '') {
    return INITIAL_DEMO_TRANSACTIONS;
  }
  return [];
}

/**
 * Saves transactions to local cache safely.
 * Strips gigantic base64 dataUrls before saving to localStorage to prevent QuotaExceededError (5MB limit).
 * Full dataUrls are safely preserved in IndexedDB.
 */
export function setCachedLocalTransactions(txs: Transaction[]): void {
  try {
    const sanitized = txs.map((t) => {
      if (!t.attachments && !t.attachment) return t;
      const cleanAtts = (t.attachments || []).map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        size: a.size,
        // Only keep dataUrl in localStorage if under 40KB, otherwise store in IndexedDB
        dataUrl: a.dataUrl && a.dataUrl.length < 40000 ? a.dataUrl : undefined,
      }));
      return {
        ...t,
        attachments: cleanAtts,
        attachment: cleanAtts[0] || undefined,
      };
    });
    localStorage.setItem(LOCAL_TX_KEY, JSON.stringify(sanitized));
  } catch (e) {
    console.warn('LocalStorage save warning, falling back without attachments:', e);
    try {
      const bare = txs.map((t) => ({ ...t, attachments: undefined, attachment: undefined }));
      localStorage.setItem(LOCAL_TX_KEY, JSON.stringify(bare));
    } catch {}
  }
}

export function getCachedItems(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_ITEMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read cached items', e);
  }
  return STOCK_PURCHASED_ITEMS;
}

export function setCachedItems(items: string[]): void {
  try {
    localStorage.setItem(LOCAL_ITEMS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save items to local cache', e);
  }
}

export function getCachedSellers(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_SELLERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read cached sellers', e);
  }
  return STOCK_PURCHASED_SELLERS;
}

export function setCachedSellers(sellers: string[]): void {
  try {
    localStorage.setItem(LOCAL_SELLERS_KEY, JSON.stringify(sellers));
  } catch (e) {
    console.error('Failed to save sellers to local cache', e);
  }
}

/**
 * Hydrates transactions with full-resolution attachments stored in IndexedDB.
 */
export async function hydrateTransactionsWithAttachments(
  transactions: Transaction[]
): Promise<Transaction[]> {
  try {
    const { byId, bySignature } = await getAllStoredAttachments();

    // Check if any transaction has attachments missing dataUrl
    let hasMissingDataUrl = false;
    for (const tx of transactions) {
      const atts = tx.attachments || (tx.attachment ? [tx.attachment] : []);
      for (const a of atts) {
        if (!a.dataUrl && a.id) {
          hasMissingDataUrl = true;
          break;
        }
      }
      if (hasMissingDataUrl) break;
    }

    let serverAttachments: Record<string, BillAttachment> = {};
    if (hasMissingDataUrl) {
      serverAttachments = await fetchAllAttachmentsFromServer();
    }

    return await Promise.all(
      transactions.map(async (tx) => {
        const sig = getTxSignature(tx.date, tx.amount, tx.category);
        const storedAtts = byId.get(tx.id) || bySignature.get(sig);

        let finalAtts = tx.attachments || (tx.attachment ? [tx.attachment] : []);

        if (storedAtts && storedAtts.length > 0) {
          finalAtts = storedAtts;
        } else if (finalAtts.length > 0) {
          // If dataUrl not in sheet record, check if stored on server
          finalAtts = finalAtts.map((a) => {
            if (a.dataUrl) return a;
            const fromServer = a.id ? serverAttachments[a.id] : undefined;
            if (fromServer && fromServer.dataUrl) {
              return { ...a, dataUrl: fromServer.dataUrl };
            }
            return a;
          });

          // Save to local IndexedDB so future access is instantaneous
          const hasData = finalAtts.some((a) => a.dataUrl);
          if (hasData) {
            saveAttachmentsForTx(tx.id, finalAtts, sig).catch(() => {});
          }
        }

        return {
          ...tx,
          attachments: finalAtts,
          attachment: finalAtts[0] || undefined,
        };
      })
    );
  } catch (err) {
    console.warn('Failed to hydrate attachments:', err);
    return transactions;
  }
}

/**
 * Fetches data from Google Apps Script Web App
 */
export async function fetchSheetData(scriptUrl: string): Promise<{
  categories: CategoriesData;
  transactions: Transaction[];
  users?: SheetUserRecord[];
  items?: string[];
  sellers?: string[];
  backendVersion?: string;
  isOffline?: boolean;
}> {
  if (!scriptUrl || scriptUrl.trim() === '') {
    const local = getCachedLocalTransactions();
    const hydrated = await hydrateTransactionsWithAttachments(local);
    return {
      categories: DEFAULT_CATEGORIES,
      transactions: hydrated,
      items: getCachedItems(),
      sellers: getCachedSellers(),
      backendVersion: '2.2',
    };
  }

  try {
    const url = new URL(scriptUrl.trim());
    url.searchParams.set('action', 'getData');
    url.searchParams.set('t', Date.now().toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script responded with HTTP ${response.status}`);
    }

    const data: SheetApiResponse = await response.json();

    if (data.status === 'error') {
      throw new Error(data.message || 'Error reported by Google Apps Script');
    }

  const categories: CategoriesData = {
    income: data.categories?.income?.length ? data.categories.income : DEFAULT_CATEGORIES.income,
    expense: data.categories?.expense?.length ? data.categories.expense : DEFAULT_CATEGORIES.expense,
  };

  // Map incoming transactions with deterministic, stable IDs
  const rawTransactions: Transaction[] = (data.transactions || []).map((item, idx) => {
    const rawTs = item.timestamp || '';
    const stableId = item.id || `tx_${idx + 1}_${String(rawTs).replace(/[^0-9]/g, '').slice(-8) || idx}`;

    const itemAtts = item.attachments && item.attachments.length > 0
      ? item.attachments
      : (item.attachment ? [item.attachment] : []);

    return {
      id: stableId,
      rowNumber: item.rowNumber || idx + 2,
      timestamp: rawTs || new Date().toISOString(),
      date: item.date || new Date().toISOString().split('T')[0],
      type: item.type === 'Income' ? ('Income' as const) : ('Expense' as const),
      category: item.category || 'General',
      amount: Number(item.amount) || 0,
      note: item.note || '',
      item: item.item || '',
      sellerDetails: item.sellerDetails || '',
      attachments: itemAtts,
      attachment: itemAtts[0] || undefined,
    };
  });

  // Client-side Deduplication: filter out corrupted empty records and duplicate rows from Google Sheet
  const seenSignatures = new Set<string>();
  const deduplicatedList: Transaction[] = [];

  for (const t of rawTransactions) {
    // Filter out corrupted zero-amount rows created by previous failed delete requests
    if (!t.date && t.amount === 0 && !t.note) continue;
    if (t.amount === 0 && !t.note && !t.item && t.category === 'General') continue;

    const sig = `${t.date}_${t.type}_${t.category}_${t.amount}_${t.note}_${t.item || ''}_${t.sellerDetails || ''}`;
    if (!seenSignatures.has(sig)) {
      seenSignatures.add(sig);
      deduplicatedList.push(t);
    }
  }

  // Hydrate all transactions with persistent attachments from IndexedDB so they NEVER disappear!
  const transactions = await hydrateTransactionsWithAttachments(deduplicatedList);

  setCachedLocalTransactions(transactions);

  // Sync users if returned by Apps Script
  if (data.users && Array.isArray(data.users)) {
    syncUsersFromSheet(data.users);
  }

  // Sync items if returned
  let items = getCachedItems();
  if (data.items && Array.isArray(data.items) && data.items.length > 0) {
    items = data.items.map((i) => String(i).trim()).filter(Boolean);
    setCachedItems(items);
  }

  // Sync sellers if returned
  let sellers = getCachedSellers();
  if (data.sellers && Array.isArray(data.sellers) && data.sellers.length > 0) {
    sellers = data.sellers.map((s) => String(s).trim()).filter(Boolean);
    setCachedSellers(sellers);
  }

  return {
    categories,
    transactions,
    users: data.users,
    items,
    sellers,
    backendVersion: data.backendVersion || '1.0',
    isOffline: false,
  };
} catch (fetchErr) {
  console.warn('Could not fetch from Google Apps Script, serving local cached data:', fetchErr);
  const local = getCachedLocalTransactions();
  const hydrated = await hydrateTransactionsWithAttachments(local);
  return {
    categories: DEFAULT_CATEGORIES,
    transactions: hydrated,
    items: getCachedItems(),
    sellers: getCachedSellers(),
    backendVersion: '2.2',
    isOffline: true,
  };
}
}

/**
 * Sends a new transaction to the Google Apps Script Web App.
 * Guaranteed idempotency: deduplicates simultaneous requests and persists attachments in IndexedDB.
 */
export async function saveTransaction(
  scriptUrl: string,
  tx: {
    date: string;
    type: 'Income' | 'Expense';
    category: string;
    amount: number;
    note: string;
    item?: string;
    sellerDetails?: string;
    attachment?: BillAttachment;
    attachments?: BillAttachment[];
  }
): Promise<Transaction> {
  const attachmentsList = tx.attachments && tx.attachments.length > 0
    ? tx.attachments
    : (tx.attachment ? [tx.attachment] : []);

  // Generate a stable unique client transaction ID
  const clientTxId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const sig = getTxSignature(tx.date, tx.amount, tx.category);

  // Guard against duplicate concurrent clicks for identical submission
  const subKey = `${tx.date}_${tx.type}_${tx.category}_${tx.amount}_${tx.note}_${tx.item || ''}`;
  if (inFlightSubmissions.has(subKey)) {
    console.warn('Duplicate submission in flight prevented:', subKey);
    throw new Error('A transaction with the same details is currently saving. Please wait a moment.');
  }
  inFlightSubmissions.add(subKey);

  // Immediately store high-res attachments to IndexedDB so they survive page refresh and navigation
  if (attachmentsList.length > 0) {
    await saveAttachmentsForTx(clientTxId, attachmentsList, sig);
  }

  const newTx: Transaction = {
    id: clientTxId,
    timestamp: new Date().toISOString(),
    date: tx.date,
    type: tx.type,
    category: tx.category,
    amount: Number(tx.amount),
    note: tx.note || '',
    item: tx.item || '',
    sellerDetails: tx.sellerDetails || '',
    attachment: attachmentsList[0] || undefined,
    attachments: attachmentsList,
  };

  const finalize = (finalRecord: Transaction) => {
    inFlightSubmissions.delete(subKey);
    const current = getCachedLocalTransactions();
    // Ensure not duplicated in cache
    const filtered = current.filter((t) => t.id !== finalRecord.id);
    setCachedLocalTransactions([finalRecord, ...filtered]);
    return finalRecord;
  };

  if (!scriptUrl || scriptUrl.trim() === '') {
    // Demo mode
    return finalize(newTx);
  }

  // Payload for Google Apps Script with clientTxId for backend deduplication
  const txPayload = {
    action: 'add',
    id: clientTxId,
    clientTxId: clientTxId,
    timestamp: newTx.timestamp,
    date: newTx.date,
    type: newTx.type,
    category: newTx.category,
    amount: newTx.amount,
    note: newTx.note,
    item: newTx.item,
    sellerDetails: newTx.sellerDetails,
    attachments: attachmentsList.map((a) => ({
      id: a.id || `att_${Date.now()}`,
      name: a.name,
      size: a.size,
      type: a.type,
      dataUrl: a.dataUrl && a.dataUrl.length < 45000 ? a.dataUrl : undefined,
    })),
    attachment: attachmentsList[0] ? {
      name: attachmentsList[0].name,
      size: attachmentsList[0].size,
      type: attachmentsList[0].type,
      dataUrl: attachmentsList[0].dataUrl && attachmentsList[0].dataUrl.length < 45000 ? attachmentsList[0].dataUrl : undefined,
    } : undefined,
  };

  // Sync all attachments to backend server asynchronously so other devices can view & download
  if (attachmentsList.length > 0) {
    attachmentsList.forEach((a) => {
      syncAttachmentToServer(a, clientTxId).catch(() => {});
    });
  }

  const hasAttachmentData = attachmentsList.some((a) => Boolean(a.dataUrl));

  try {
    // If has attachment data, use direct POST with text/plain to avoid HTTP 414 URI Too Long limits
    if (hasAttachmentData) {
      const postUrl = new URL(scriptUrl.trim());
      postUrl.searchParams.set('action', 'add');

      const response = await fetch(postUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(txPayload),
        redirect: 'follow',
      });

      if (response.ok) {
        const result: SheetApiResponse = await response.json();
        if (result.status === 'success' && result.record) {
          const finalTx: Transaction = {
            ...newTx,
            id: result.record.id || clientTxId,
            rowNumber: result.record.rowNumber,
            timestamp: result.record.timestamp || newTx.timestamp,
            attachments: attachmentsList,
            attachment: attachmentsList[0] || undefined,
          };
          if (result.record.id && result.record.id !== clientTxId && attachmentsList.length > 0) {
            await saveAttachmentsForTx(result.record.id, attachmentsList, sig);
          }
          return finalize(finalTx);
        }
        if (result.status === 'error') {
          throw new Error(result.message || 'Apps script reported an error');
        }
      }
      throw new Error(`HTTP ${response.status}`);
    }

    // Fast direct GET for transactions without attachments
    const getUrl = new URL(scriptUrl.trim());
    getUrl.searchParams.set('action', 'add');
    getUrl.searchParams.set('data', encodeURIComponent(JSON.stringify(txPayload)));
    getUrl.searchParams.set('t', Date.now().toString());

    const response = await fetch(getUrl.toString(), {
      method: 'GET',
      redirect: 'follow',
    });

    if (response.ok) {
      const result: SheetApiResponse = await response.json();
      if (result.status === 'success' && result.record) {
        const finalTx: Transaction = {
          ...newTx,
          id: result.record.id || clientTxId,
          rowNumber: result.record.rowNumber,
          timestamp: result.record.timestamp || newTx.timestamp,
          attachments: attachmentsList,
          attachment: attachmentsList[0] || undefined,
        };
        if (result.record.id && result.record.id !== clientTxId && attachmentsList.length > 0) {
          await saveAttachmentsForTx(result.record.id, attachmentsList, sig);
        }
        return finalize(finalTx);
      }
      if (result.status === 'error') {
        throw new Error(result.message || 'Apps script reported an error');
      }
    }
    throw new Error(`HTTP ${response.status}`);
  } catch (primaryErr) {
    const errorMsg = (primaryErr as Error).message || '';
    if (errorMsg.includes('Apps script reported an error') || errorMsg.includes('already recorded')) {
      inFlightSubmissions.delete(subKey);
      throw primaryErr;
    }

    console.warn('Primary save attempt failed, trying POST fallback...', primaryErr);
    try {
      const postUrl = new URL(scriptUrl.trim());
      postUrl.searchParams.set('action', 'add');

      const fbResponse = await fetch(postUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(txPayload),
        redirect: 'follow',
      });

      if (fbResponse.ok) {
        const fbResult: SheetApiResponse = await fbResponse.json();
        if (fbResult.status === 'success' && fbResult.record) {
          const finalTx: Transaction = {
            ...newTx,
            id: fbResult.record.id || clientTxId,
            rowNumber: fbResult.record.rowNumber,
            timestamp: fbResult.record.timestamp || newTx.timestamp,
            attachments: attachmentsList,
            attachment: attachmentsList[0] || undefined,
          };
          if (fbResult.record.id && fbResult.record.id !== clientTxId && attachmentsList.length > 0) {
            await saveAttachmentsForTx(fbResult.record.id, attachmentsList, sig);
          }
          return finalize(finalTx);
        }
      }
      // If server added it but redirect failed or returned status, finalize locally so user isn't blocked
      return finalize(newTx);
    } catch (postFallbackErr) {
      // Finalize locally so transaction is never lost and UI doesn't stall
      return finalize(newTx);
    }
  }
}

/**
 * Updates an existing transaction in the local cache, IndexedDB, and Google Apps Script Web App
 */
export async function updateTransactionInSheet(
  scriptUrl: string,
  updatedTx: Transaction
): Promise<Transaction> {
  const sig = getTxSignature(updatedTx.date, updatedTx.amount, updatedTx.category);

  // Update attachments in IndexedDB if present
  if (updatedTx.attachments && updatedTx.attachments.length > 0) {
    await saveAttachmentsForTx(updatedTx.id, updatedTx.attachments, sig);
  }

  // Update local cache
  const current = getCachedLocalTransactions();
  const index = current.findIndex((t) => t.id === updatedTx.id);
  if (index !== -1) {
    current[index] = { ...updatedTx };
  } else {
    current.unshift(updatedTx);
  }
  setCachedLocalTransactions([...current]);

  const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
  if (!urlToUse) {
    return updatedTx;
  }

  const payload = {
    action: 'editTransaction',
    id: updatedTx.id,
    rowNumber: updatedTx.rowNumber,
    timestamp: updatedTx.timestamp,
    date: updatedTx.date,
    type: updatedTx.type,
    category: updatedTx.category,
    amount: updatedTx.amount,
    note: updatedTx.note,
    item: updatedTx.item || '',
    sellerDetails: updatedTx.sellerDetails || '',
  };

  try {
    const getUrl = new URL(urlToUse.trim());
    getUrl.searchParams.set('action', 'editTransaction');
    getUrl.searchParams.set('id', updatedTx.id);
    if (updatedTx.rowNumber) getUrl.searchParams.set('rowNumber', String(updatedTx.rowNumber));
    getUrl.searchParams.set('date', updatedTx.date);
    getUrl.searchParams.set('type', updatedTx.type);
    getUrl.searchParams.set('category', updatedTx.category);
    getUrl.searchParams.set('amount', String(updatedTx.amount));
    getUrl.searchParams.set('note', updatedTx.note);
    if (updatedTx.item) getUrl.searchParams.set('item', updatedTx.item);
    if (updatedTx.sellerDetails) getUrl.searchParams.set('sellerDetails', updatedTx.sellerDetails);
    getUrl.searchParams.set('data', encodeURIComponent(JSON.stringify(payload)));
    getUrl.searchParams.set('t', Date.now().toString());

    const getRes = await fetch(getUrl.toString(), { method: 'GET', redirect: 'follow' });
    if (getRes.ok) {
      return updatedTx;
    }
  } catch (getErr) {
    console.warn('GET editTransaction failed, trying POST fallback...', getErr);
  }

  try {
    const postUrl = new URL(urlToUse.trim());
    postUrl.searchParams.set('action', 'editTransaction');

    const postRes = await fetch(postUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    if (postRes.ok) {
      const resJson = await postRes.json();
      if (resJson.status === 'success') {
        return updatedTx;
      }
    }
  } catch (err) {
    console.warn('POST editTransaction fallback notice:', err);
  }

  return updatedTx;
}

/**
 * Deletes a transaction from the local cache, IndexedDB, and Google Sheet backend.
 * Guaranteed deletion in Google Sheet with multi-criteria fallback.
 */
export async function deleteTransactionFromSheet(
  scriptUrl: string,
  txId: string,
  rowNumber?: number,
  txDetails?: Partial<Transaction>
): Promise<void> {
  const sig = getTxSignature(txDetails?.date, txDetails?.amount, txDetails?.category);

  // 1. Remove from IndexedDB
  await deleteAttachmentsForTx(txId, sig);

  // 2. Remove from local cache immediately
  const current = getCachedLocalTransactions();
  const updated = current.filter((t) => t.id !== txId);
  setCachedLocalTransactions(updated);

  const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
  if (!urlToUse) return;

  const payload = {
    action: 'deleteTransaction',
    id: txId,
    clientTxId: txId,
    rowNumber: rowNumber,
    timestamp: txDetails?.timestamp,
    targetDate: txDetails?.date,
    targetAmount: txDetails?.amount,
    targetCategory: txDetails?.category,
    targetNote: txDetails?.note,
  };

  // 3. Try fast GET delete first (avoids 405 Method Not Allowed)
  try {
    const getUrl = new URL(urlToUse.trim());
    getUrl.searchParams.set('action', 'deleteTransaction');
    getUrl.searchParams.set('id', txId);
    if (rowNumber) getUrl.searchParams.set('rowNumber', String(rowNumber));
    if (txDetails?.timestamp) getUrl.searchParams.set('timestamp', txDetails.timestamp);
    if (txDetails?.date) getUrl.searchParams.set('targetDate', txDetails.date);
    if (txDetails?.amount !== undefined) getUrl.searchParams.set('targetAmount', String(txDetails.amount));
    if (txDetails?.category) getUrl.searchParams.set('targetCategory', txDetails.category);
    if (txDetails?.note) getUrl.searchParams.set('targetNote', txDetails.note);
    getUrl.searchParams.set('t', Date.now().toString());

    const getRes = await fetch(getUrl.toString(), { method: 'GET', redirect: 'follow' });
    if (getRes.ok) {
      return;
    }
  } catch (getErr) {
    console.warn('GET deleteTransaction failed, trying POST fallback...', getErr);
  }

  // 4. Try POST delete fallback
  try {
    const postUrl = new URL(urlToUse.trim());
    postUrl.searchParams.set('action', 'deleteTransaction');

    await fetch(postUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
  } catch (postErr) {
    console.warn('POST deleteTransaction notice:', postErr);
  }
}

/**
 * Deletes multiple transactions from local cache, IndexedDB, and Google Apps Script Web App
 */
export async function bulkDeleteTransactionsFromSheet(
  scriptUrl: string,
  txs: Transaction[],
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  const idsToDelete = new Set(txs.map((t) => t.id));

  // 1. Delete all attachments from IndexedDB
  for (const t of txs) {
    await deleteAttachmentsForTx(t.id, getTxSignature(t.date, t.amount, t.category));
  }

  // 2. Remove from local cache
  const current = getCachedLocalTransactions();
  const updated = current.filter((t) => !idsToDelete.has(t.id));
  setCachedLocalTransactions(updated);

  const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
  if (!urlToUse) {
    if (onProgress) onProgress(txs.length, txs.length);
    return;
  }

  const payload = {
    action: 'bulkDeleteTransactions',
    records: txs.map((t) => ({
      id: t.id,
      rowNumber: t.rowNumber,
      timestamp: t.timestamp,
      date: t.date,
      type: t.type,
      category: t.category,
      amount: t.amount,
      note: t.note,
    })),
  };

  // 3. Try batch delete via POST
  try {
    const postUrl = new URL(urlToUse.trim());
    postUrl.searchParams.set('action', 'bulkDeleteTransactions');

    const postRes = await fetch(postUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    if (postRes.ok) {
      const resJson = await postRes.json();
      if (resJson.status === 'success') {
        if (onProgress) onProgress(txs.length, txs.length);
        return;
      }
    }
  } catch (batchErr) {
    console.warn('Batch delete attempt failed, using sequential fallback...', batchErr);
  }

  // 4. Sequential fallback
  let done = 0;
  for (const tx of txs) {
    try {
      await deleteTransactionFromSheet(urlToUse, tx.id, tx.rowNumber, tx);
    } catch (e) {
      console.warn('Failed to delete transaction:', tx.id, e);
    }
    done++;
    if (onProgress) onProgress(done, txs.length);
  }
}

/**
 * Updates multiple transactions in local cache and Google Apps Script Web App
 */
export async function bulkUpdateTransactionsInSheet(
  scriptUrl: string,
  updatedTxs: Transaction[],
  onProgress?: (completed: number, total: number) => void
): Promise<Transaction[]> {
  const updateMap = new Map(updatedTxs.map((t) => [t.id, t]));
  const current = getCachedLocalTransactions();
  const updated = current.map((t) => updateMap.get(t.id) || t);
  setCachedLocalTransactions(updated);

  const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
  if (!urlToUse) return updatedTxs;

  // 1. Try batch edit via POST first
  try {
    const payload = {
      action: 'bulkEditTransactions',
      records: updatedTxs.map((t) => ({
        id: t.id,
        rowNumber: t.rowNumber,
        timestamp: t.timestamp,
        date: t.date,
        type: t.type,
        category: t.category,
        amount: t.amount,
        note: t.note,
        item: t.item || '',
        sellerDetails: t.sellerDetails || '',
      })),
    };

    const postUrl = new URL(urlToUse.trim());
    postUrl.searchParams.set('action', 'bulkEditTransactions');

    const postRes = await fetch(postUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    if (postRes.ok) {
      const resJson = await postRes.json();
      if (resJson.status === 'success') {
        if (onProgress) onProgress(updatedTxs.length, updatedTxs.length);
        return updatedTxs;
      }
    }
  } catch (batchErr) {
    console.warn('Batch update attempt failed, using sequential fallback...', batchErr);
  }

  // 2. Fallback: update sequentially
  let done = 0;
  for (const tx of updatedTxs) {
    try {
      await updateTransactionInSheet(urlToUse, tx);
    } catch (e) {
      console.warn('Failed to update transaction:', tx.id, e);
    }
    done++;
    if (onProgress) onProgress(done, updatedTxs.length);
  }
  return updatedTxs;
}

/**
 * Saves a user (Name/USERNAME, Password, Role) to the Google Sheet "Users" tab
 */
export async function saveUserToSheet(
  scriptUrl: string,
  userData: {
    name: string;
    password?: string;
    role: UserRole;
    mobile?: string;
  }
): Promise<void> {
  const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
  if (!urlToUse || urlToUse.trim() === '') {
    throw new Error('Google Apps Script URL is not configured. Please configure it in Settings to sync with Google Sheet.');
  }

  const payload = {
    action: 'saveUser',
    name: userData.name.trim(),
    password: (userData.password || '').trim(),
    role: userData.role,
    mobile: (userData.mobile || '').trim(),
  };

  let savedSuccessfully = false;
  let lastError: Error | null = null;

  try {
    const getUrl = new URL(urlToUse.trim());
    getUrl.searchParams.set('action', 'saveUser');
    getUrl.searchParams.set('name', payload.name);
    getUrl.searchParams.set('password', payload.password);
    getUrl.searchParams.set('role', payload.role);
    if (payload.mobile) {
      getUrl.searchParams.set('mobile', payload.mobile);
    }
    getUrl.searchParams.set('data', JSON.stringify(payload));
    getUrl.searchParams.set('t', Date.now().toString());

    const response = await fetch(getUrl.toString(), {
      method: 'GET',
      redirect: 'follow',
    });

    if (response.ok) {
      const resData = await response.json();
      if (resData.status === 'success') {
        savedSuccessfully = true;
      } else if (resData.status === 'error') {
        throw new Error(resData.message || 'Error reported by Google Sheet backend');
      }
    }
  } catch (getErr) {
    lastError = getErr as Error;
    console.warn('GET saveUser failed, attempting POST fallback...', getErr);
  }

  if (!savedSuccessfully) {
    try {
      const postResponse = await fetch(urlToUse.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });

      if (postResponse.ok) {
        const postData = await postResponse.json();
        if (postData.status === 'success') {
          savedSuccessfully = true;
        } else if (postData.status === 'error') {
          throw new Error(postData.message || 'Error reported by Google Sheet backend');
        }
      }
    } catch (postErr) {
      lastError = postErr as Error;
      console.warn('POST saveUser fallback also failed:', postErr);
    }
  }

  if (!savedSuccessfully) {
    throw new Error(
      `Failed to save user to Google Sheet. ${lastError ? lastError.message : ''} ` +
      `Please ensure your Apps Script is updated and deployed as a Web App.`
    );
  }

  try {
    await fetchSheetData(urlToUse);
  } catch (refreshErr) {
    console.warn('Background refresh after saveUser had warning:', refreshErr);
  }
}

/**
 * Deletes a user by Name/USERNAME from the Google Sheet "Users" tab
 */
export async function deleteUserFromSheet(
  scriptUrl: string,
  name: string
): Promise<void> {
  const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
  if (!urlToUse || urlToUse.trim() === '') return;

  const payload = {
    action: 'deleteUser',
    name: name.trim(),
  };

  try {
    const getUrl = new URL(urlToUse.trim());
    getUrl.searchParams.set('action', 'deleteUser');
    getUrl.searchParams.set('name', payload.name);
    getUrl.searchParams.set('t', Date.now().toString());

    await fetch(getUrl.toString(), {
      method: 'GET',
      redirect: 'follow',
    });
  } catch (e) {
    console.warn('GET deleteUser failed, attempting POST...', e);
    try {
      await fetch(urlToUse.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });
    } catch (postErr) {
      console.warn('POST deleteUser failed:', postErr);
    }
  }
}

/**
 * Saves a new Item to the Google Sheet "Items" tab (or updates local cache if no sheet connected)
 */
export async function saveItemToSheet(
  scriptUrl: string,
  itemName: string
): Promise<void> {
  const cleanItem = itemName.trim();
  if (!cleanItem) throw new Error('Item name cannot be empty');

  const currentItems = getCachedItems();
  const exists = currentItems.some((it) => it.toLowerCase() === cleanItem.toLowerCase());
  if (!exists) {
    const updatedItems = [...currentItems, cleanItem];
    setCachedItems(updatedItems);
  }

  const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
  if (!urlToUse || urlToUse.trim() === '') return;

  const payload = { action: 'saveItem', name: cleanItem };
  let saved = false;

  try {
    const getUrl = new URL(urlToUse.trim());
    getUrl.searchParams.set('action', 'saveItem');
    getUrl.searchParams.set('name', cleanItem);
    getUrl.searchParams.set('t', Date.now().toString());

    const response = await fetch(getUrl.toString(), {
      method: 'GET',
      redirect: 'follow',
    });

    if (response.ok) {
      const res = await response.json();
      if (res.status === 'success' || (res.message && res.message.toLowerCase().includes('already exist'))) {
        saved = true;
      }
    }
  } catch (e) {
    console.warn('GET saveItem failed, attempting POST...', e);
  }

  if (!saved) {
    try {
      const postUrl = new URL(urlToUse.trim());
      postUrl.searchParams.set('action', 'saveItem');

      const postResponse = await fetch(postUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });
      if (postResponse.ok) {
        const postData = await postResponse.json();
        if (postData.status === 'success' || (postData.message && postData.message.toLowerCase().includes('already exist'))) {
          saved = true;
        }
      }
    } catch (postErr) {
      console.warn('POST saveItem failed:', postErr);
    }
  }
}

/**
 * Deletes an Item from the Google Sheet "Items" tab (or updates local cache)
 */
export async function deleteItemFromSheet(
  scriptUrl: string,
  itemName: string
): Promise<void> {
  const cleanItem = itemName.trim();
  const currentItems = getCachedItems();
  const updatedItems = currentItems.filter((it) => it.toLowerCase() !== cleanItem.toLowerCase());
  setCachedItems(updatedItems);

  const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
  if (!urlToUse || urlToUse.trim() === '') return;

  const payload = { action: 'deleteItem', name: cleanItem };

  try {
    const getUrl = new URL(urlToUse.trim());
    getUrl.searchParams.set('action', 'deleteItem');
    getUrl.searchParams.set('name', cleanItem);
    getUrl.searchParams.set('t', Date.now().toString());

    await fetch(getUrl.toString(), {
      method: 'GET',
      redirect: 'follow',
    });
  } catch (e) {
    console.warn('GET deleteItem failed, trying POST...', e);
    try {
      const postUrl = new URL(urlToUse.trim());
      postUrl.searchParams.set('action', 'deleteItem');

      await fetch(postUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });
    } catch (postErr) {
      console.warn('POST deleteItem failed:', postErr);
    }
  }
}

/**
 * Saves a new Seller to the Google Sheet "Sellers" tab (or updates local cache if no sheet connected)
 */
export async function saveSellerToSheet(
  scriptUrl: string,
  sellerName: string
): Promise<void> {
  const cleanSeller = sellerName.trim();
  if (!cleanSeller) throw new Error('Seller name cannot be empty');

  const currentSellers = getCachedSellers();
  const exists = currentSellers.some((s) => s.toLowerCase() === cleanSeller.toLowerCase());
  if (!exists) {
    const updatedSellers = [...currentSellers, cleanSeller];
    setCachedSellers(updatedSellers);
  }

  const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
  if (!urlToUse || urlToUse.trim() === '') return;

  const payload = { action: 'saveSeller', name: cleanSeller };
  let saved = false;

  try {
    const getUrl = new URL(urlToUse.trim());
    getUrl.searchParams.set('action', 'saveSeller');
    getUrl.searchParams.set('name', cleanSeller);
    getUrl.searchParams.set('t', Date.now().toString());

    const response = await fetch(getUrl.toString(), {
      method: 'GET',
      redirect: 'follow',
    });

    if (response.ok) {
      const res = await response.json();
      if (res.status === 'success' || (res.message && res.message.toLowerCase().includes('already exist'))) {
        saved = true;
      }
    }
  } catch (e) {
    console.warn('GET saveSeller failed, attempting POST...', e);
  }

  if (!saved) {
    try {
      const postUrl = new URL(urlToUse.trim());
      postUrl.searchParams.set('action', 'saveSeller');

      const postResponse = await fetch(postUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });
      if (postResponse.ok) {
        const postData = await postResponse.json();
        if (postData.status === 'success' || (postData.message && postData.message.toLowerCase().includes('already exist'))) {
          saved = true;
        }
      }
    } catch (postErr) {
      console.warn('POST saveSeller failed:', postErr);
    }
  }
}

/**
 * Deletes a Seller from the Google Sheet "Sellers" tab (or updates local cache)
 */
export async function deleteSellerFromSheet(
  scriptUrl: string,
  sellerName: string
): Promise<void> {
  const cleanSeller = sellerName.trim();
  const currentSellers = getCachedSellers();
  const updatedSellers = currentSellers.filter((s) => s.toLowerCase() !== cleanSeller.toLowerCase());
  setCachedSellers(updatedSellers);

  const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
  if (!urlToUse || urlToUse.trim() === '') return;

  const payload = { action: 'deleteSeller', name: cleanSeller };

  try {
    const getUrl = new URL(urlToUse.trim());
    getUrl.searchParams.set('action', 'deleteSeller');
    getUrl.searchParams.set('name', cleanSeller);
    getUrl.searchParams.set('t', Date.now().toString());

    await fetch(getUrl.toString(), {
      method: 'GET',
      redirect: 'follow',
    });
  } catch (e) {
    console.warn('GET deleteSeller failed, trying POST...', e);
    try {
      const postUrl = new URL(urlToUse.trim());
      postUrl.searchParams.set('action', 'deleteSeller');

      await fetch(postUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });
    } catch (postErr) {
      console.warn('POST deleteSeller failed:', postErr);
    }
  }
}

/**
 * Calls the backend to clean up duplicate and corrupt empty rows in Google Sheet.
 */
export async function deduplicateSheetInBackend(
  scriptUrl: string
): Promise<{ count: number; message: string }> {
  const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
  if (!urlToUse) {
    return { count: 0, message: 'Demo mode active' };
  }

  const postUrl = new URL(urlToUse.trim());
  postUrl.searchParams.set('action', 'deduplicateSheet');

  try {
    const res = await fetch(postUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'deduplicateSheet' }),
      redirect: 'follow',
    });
    if (res.ok) {
      const data: SheetApiResponse = await res.json();
      if (data.status === 'success') {
        return { count: data.count || 0, message: data.message || 'Sheet deduplicated successfully' };
      }
    }
  } catch (e) {
    console.warn('POST deduplicateSheet failed, trying GET fallback...', e);
  }

  const getUrl = new URL(urlToUse.trim());
  getUrl.searchParams.set('action', 'deduplicateSheet');
  getUrl.searchParams.set('t', Date.now().toString());

  const getRes = await fetch(getUrl.toString(), { method: 'GET', redirect: 'follow' });
  if (getRes.ok) {
    const data: SheetApiResponse = await getRes.json();
    return { count: data.count || 0, message: data.message || 'Sheet deduplicated successfully' };
  }

  throw new Error('Failed to deduplicate Google Sheet. Please update your backend script to v2.2.');
}
