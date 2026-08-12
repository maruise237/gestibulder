'use client';

/**
 * File d'attente hors-ligne générique, basée sur IndexedDB.
 *
 * Quand une action serveur (server action) ne peut pas être exécutée faute
 * de réseau, on la met en file ici au lieu de la perdre. À la reconnexion,
 * `offline-sync.ts` rejoue chaque action dans l'ordre et la retire de la
 * file en cas de succès.
 */

export interface QueuedAction {
  id: string;
  type: string;
  payload: unknown;
  createdAt: number;
  label: string;
}

const DB_NAME = 'gestibulder-offline';
const STORE_NAME = 'queue';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB indisponible'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueAction(type: string, payload: unknown, label: string): Promise<QueuedAction> {
  const db = await openDb();
  const action: QueuedAction = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    payload,
    createdAt: Date.now(),
    label,
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(action);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return action;
}

export async function getQueuedActions(): Promise<QueuedAction[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result as QueuedAction[]).sort((a, b) => a.createdAt - b.createdAt));
    request.onerror = () => reject(request.error);
  });
}

export async function removeQueuedAction(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueueCount(): Promise<number> {
  try {
    const actions = await getQueuedActions();
    return actions.length;
  } catch {
    return 0;
  }
}
