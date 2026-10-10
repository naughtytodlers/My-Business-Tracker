/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BillAttachment } from '../types';

const DB_NAME = 'NaughtyToddlers_Attachments_DB';
const DB_VERSION = 1;
const STORE_NAME = 'tx_attachments';

interface AttachmentRecord {
  txId: string;
  signature?: string; // e.g. "2026-10-08_1500_Stock Purchased"
  attachments: BillAttachment[];
  updatedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'txId' });
        store.createIndex('signature', 'signature', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Creates a stable signature for a transaction to recover attachments
 * even if the transaction ID changes after Google Sheets sync.
 */
export function getTxSignature(date?: string, amount?: number | string, category?: string): string {
  const d = String(date || '').trim();
  const a = Number(amount) || 0;
  const c = String(category || '').trim().toLowerCase();
  return `${d}_${a}_${c}`;
}

// In-memory cache for fast synchronous access across components
export const memoryAttachmentCache = new Map<string, string>();

/**
 * Stores attachments for a specific transaction into IndexedDB and memory.
 * Retains full-resolution data URLs without localStorage size limits.
 */
export async function saveAttachmentsForTx(
  txId: string,
  attachments: BillAttachment[],
  signature?: string
): Promise<void> {
  if (!txId || !attachments || attachments.length === 0) return;

  // Cache in memory immediately for zero-delay component rendering
  for (const a of attachments) {
    if (a.id && a.dataUrl) {
      memoryAttachmentCache.set(a.id, a.dataUrl);
    }
  }

  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const record: AttachmentRecord = {
        txId,
        signature: signature || '',
        attachments,
        updatedAt: Date.now(),
      };

      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to save attachment to IndexedDB:', err);
  }
}

/**
 * Retrieves attachments for a transaction by its ID or fallback signature.
 */
export async function getAttachmentsForTx(
  txId: string,
  signature?: string
): Promise<BillAttachment[]> {
  if (!txId && !signature) return [];

  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      if (txId) {
        const idReq = store.get(txId);
        idReq.onsuccess = () => {
          if (idReq.result && idReq.result.attachments) {
            resolve(idReq.result.attachments);
            return;
          }

          // If not found by txId and signature provided, query by signature index
          if (signature) {
            try {
              const sigIndex = store.index('signature');
              const sigReq = sigIndex.get(signature);
              sigReq.onsuccess = () => {
                if (sigReq.result && sigReq.result.attachments) {
                  resolve(sigReq.result.attachments);
                } else {
                  resolve([]);
                }
              };
              sigReq.onerror = () => resolve([]);
            } catch {
              resolve([]);
            }
          } else {
            resolve([]);
          }
        };
        idReq.onerror = () => resolve([]);
      } else if (signature) {
        try {
          const sigIndex = store.index('signature');
          const sigReq = sigIndex.get(signature);
          sigReq.onsuccess = () => {
            if (sigReq.result && sigReq.result.attachments) {
              resolve(sigReq.result.attachments);
            } else {
              resolve([]);
            }
          };
          sigReq.onerror = () => resolve([]);
        } catch {
          resolve([]);
        }
      } else {
        resolve([]);
      }
    });
  } catch {
    return [];
  }
}

/**
 * Returns all stored attachments indexed by both txId and signature.
 */
export async function getAllStoredAttachments(): Promise<{
  byId: Map<string, BillAttachment[]>;
  bySignature: Map<string, BillAttachment[]>;
}> {
  const byId = new Map<string, BillAttachment[]>();
  const bySignature = new Map<string, BillAttachment[]>();

  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const rec: AttachmentRecord = cursor.value;
          if (rec.txId && rec.attachments && rec.attachments.length > 0) {
            byId.set(rec.txId, rec.attachments);
          }
          if (rec.signature && rec.attachments && rec.attachments.length > 0) {
            bySignature.set(rec.signature, rec.attachments);
          }
          cursor.continue();
        } else {
          resolve({ byId, bySignature });
        }
      };

      request.onerror = () => resolve({ byId, bySignature });
    });
  } catch {
    return { byId, bySignature };
  }
}

/**
 * Removes attachments for a deleted transaction.
 */
export async function deleteAttachmentsForTx(txId: string, signature?: string): Promise<void> {
  if (!txId && !signature) return;

  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      if (txId) {
        store.delete(txId);
      }

      if (signature) {
        try {
          const sigIndex = store.index('signature');
          const sigReq = sigIndex.openCursor(IDBKeyRange.only(signature));
          sigReq.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              cursor.delete();
              cursor.continue();
            }
          };
        } catch {}
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  } catch {}
}

/**
 * Compresses an image file (e.g. screenshot or receipt) using HTML5 Canvas
 * so that it is lightweight (~20-30KB) and syncs instantly across devices.
 * 850px max dimension provides crystal-clear readability for invoices and bills,
 * while fitting safely inside cloud cells and network payloads.
 */
export async function compressImageAttachment(file: File): Promise<BillAttachment> {
  const fileId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // If not an image, read standard dataUrl directly
  if (!file.type.startsWith('image/')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          memoryAttachmentCache.set(fileId, dataUrl);
        }
        resolve({
          id: fileId,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          hasData: true,
        });
      };
      reader.onerror = () => {
        resolve({
          id: fileId,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
        });
      };
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 850;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.68);
            memoryAttachmentCache.set(fileId, compressedDataUrl);
            resolve({
              id: fileId,
              name: file.name.replace(/\.[^/.]+$/, '') + '.jpeg',
              type: 'image/jpeg',
              size: Math.round((compressedDataUrl.length * 3) / 4),
              dataUrl: compressedDataUrl,
              hasData: true,
            });
            return;
          }
        } catch (canvasErr) {
          console.warn('Canvas compression fallback:', canvasErr);
        }

        // Fallback if canvas fails
        const fallbackUrl = e.target?.result as string;
        if (fallbackUrl) {
          memoryAttachmentCache.set(fileId, fallbackUrl);
        }
        resolve({
          id: fileId,
          name: file.name,
          type: file.type || 'image/jpeg',
          size: file.size,
          dataUrl: fallbackUrl,
          hasData: true,
        });
      };

      img.onerror = () => {
        resolve({
          id: fileId,
          name: file.name,
          type: file.type || 'image/jpeg',
          size: file.size,
          dataUrl: e.target?.result as string,
        });
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve({
        id: fileId,
        name: file.name,
        type: file.type || 'image/jpeg',
        size: file.size,
      });
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Persists an attachment to the backend server so ANY other device can view and download it.
 */
export async function syncAttachmentToServer(att: BillAttachment, txId?: string): Promise<void> {
  if (!att || !att.id || !att.dataUrl) return;

  try {
    await fetch('/api/attachments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: att.id,
        name: att.name,
        type: att.type,
        size: att.size,
        dataUrl: att.dataUrl,
        txId: txId || '',
      }),
    });
  } catch (err) {
    // Harmless fallback if offline or running static host
  }
}

/**
 * Fetches an attachment from the backend server by ID if not in local IndexedDB.
 */
export async function fetchAttachmentFromServer(id: string): Promise<BillAttachment | null> {
  if (!id) return null;

  try {
    const res = await fetch(`/api/attachments/${encodeURIComponent(id)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.dataUrl) {
        memoryAttachmentCache.set(data.id || id, data.dataUrl);
        return {
          id: data.id,
          name: data.name,
          type: data.type,
          size: data.size,
          dataUrl: data.dataUrl,
          hasData: true,
        };
      }
    }
  } catch {}
  return null;
}

/**
 * Robust cross-device, Incognito-safe fetcher:
 * 1. Checks memory cache
 * 2. Checks local IndexedDB
 * 3. Queries Google Apps Script (action=getAttachment&id=...)
 * 4. Queries backend server (/api/attachments/:id)
 * Caches retrieved dataUrl locally so subsequent views are instant.
 */
export async function fetchAttachmentFromCloud(
  scriptUrl: string | undefined,
  attId: string,
  txId?: string,
  signature?: string
): Promise<string | null> {
  if (!attId) return null;

  // 1. In-memory cache
  if (memoryAttachmentCache.has(attId)) {
    return memoryAttachmentCache.get(attId) || null;
  }

  // 2. IndexedDB
  try {
    const fromIdb = await getAttachmentsForTx(txId || '', signature);
    const match = fromIdb.find((a) => a.id === attId && Boolean(a.dataUrl));
    if (match && match.dataUrl) {
      memoryAttachmentCache.set(attId, match.dataUrl);
      return match.dataUrl;
    }
  } catch {}

  // 3. Google Apps Script Web App (Primary persistent cloud source across all devices & incognito)
  if (scriptUrl && scriptUrl.trim()) {
    try {
      const url = new URL(scriptUrl.trim());
      url.searchParams.set('action', 'getAttachment');
      url.searchParams.set('id', attId);
      url.searchParams.set('t', Date.now().toString());

      const res = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
      });

      if (res.ok) {
        const json = await res.json();
        if (json && json.status === 'success' && json.attachment && json.attachment.dataUrl) {
          const cloudDataUrl = json.attachment.dataUrl;
          memoryAttachmentCache.set(attId, cloudDataUrl);
          // Save to IndexedDB for offline instant access
          if (txId) {
            saveAttachmentsForTx(txId, [{
              id: attId,
              name: json.attachment.name || 'Attachment',
              type: json.attachment.type || 'image/jpeg',
              size: json.attachment.size || 0,
              dataUrl: cloudDataUrl,
              hasData: true,
            }], signature).catch(() => {});
          }
          return cloudDataUrl;
        }
      }
    } catch (e) {
      console.warn('Apps script getAttachment fetch failed:', e);
    }
  }

  // 4. Server API fallback (/api/attachments/:id)
  try {
    const fromServer = await fetchAttachmentFromServer(attId);
    if (fromServer && fromServer.dataUrl) {
      memoryAttachmentCache.set(attId, fromServer.dataUrl);
      if (txId) {
        saveAttachmentsForTx(txId, [fromServer], signature).catch(() => {});
      }
      return fromServer.dataUrl;
    }
  } catch {}

  return null;
}

/**
 * Fetches all available attachments stored on the server.
 */
export async function fetchAllAttachmentsFromServer(): Promise<Record<string, BillAttachment>> {
  try {
    const res = await fetch('/api/attachments');
    if (res.ok) {
      const data = await res.json();
      return data || {};
    }
  } catch {}
  return {};
}
