'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { enqueueAction, getQueuedActions, removeQueuedAction, getQueueCount, QueuedAction } from './offline-queue';
import { upsertPointage } from './server/pointage.actions';

/**
 * Registre des actions rejouables hors-ligne. Une "type" de file d'attente
 * doit être enregistrée ici avec la vraie fonction serveur correspondante
 * pour pouvoir être rejouée automatiquement à la reconnexion.
 */
const ACTION_REGISTRY: Record<string, (payload: any) => Promise<any>> = {
  upsertPointage: (payload) => upsertPointage(payload),
};

let isFlushing = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

/** Met une action en file si hors-ligne, ou l'exécute directement si en ligne. */
export async function runOrQueue(type: string, payload: unknown, label: string): Promise<{ queued: boolean; result?: any; error?: string }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueAction(type, payload, label);
    notifyListeners();
    return { queued: true };
  }

  const fn = ACTION_REGISTRY[type];
  if (!fn) return { queued: false, error: `Action inconnue: ${type}` };

  try {
    const result = await fn(payload);
    if (result?.error) {
      // Le serveur a répondu mais a refusé l'action (validation métier) :
      // pas la peine de mettre en file, ça échouera pareil plus tard.
      return { queued: false, result, error: result.error };
    }
    return { queued: false, result };
  } catch {
    // Le réseau a lâché pendant l'appel : on la met en file plutôt que de la perdre.
    await enqueueAction(type, payload, label);
    notifyListeners();
    return { queued: true };
  }
}

/** Rejoue toutes les actions en attente. Appelée automatiquement à la reconnexion. */
export async function flushOfflineQueue(): Promise<{ success: number; failed: number }> {
  if (isFlushing) return { success: 0, failed: 0 };
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { success: 0, failed: 0 };

  isFlushing = true;
  let success = 0;
  let failed = 0;

  try {
    const actions = await getQueuedActions();
    for (const action of actions) {
      const fn = ACTION_REGISTRY[action.type];
      if (!fn) {
        // Type inconnu (ex: ancienne version de l'app) : on l'enlève pour
        // ne pas bloquer la file indéfiniment.
        await removeQueuedAction(action.id);
        continue;
      }
      try {
        const result = await fn(action.payload);
        if (result?.error) {
          failed++;
          continue; // on la laisse en file, l'utilisateur pourra la voir/réessayer
        }
        await removeQueuedAction(action.id);
        success++;
      } catch {
        failed++;
        break; // le réseau a probablement re-lâché, on arrête pour cette fois
      }
    }
  } finally {
    isFlushing = false;
    notifyListeners();
  }

  return { success, failed };
}

/**
 * Hook React à monter une fois globalement (dans le shell du dashboard).
 * Écoute les évènements online/offline, synchronise automatiquement la file
 * dès que la connexion revient, et expose l'état pour affichage (badge).
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshCount = useCallback(() => {
    getQueueCount().then(setPendingCount);
  }, []);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    refreshCount();

    const onOnline = async () => {
      setIsOnline(true);
      const pending = await getQueueCount();
      if (pending > 0) {
        toast.info(`Reconnecté — synchronisation de ${pending} action(s) en attente...`);
        const { success, failed } = await flushOfflineQueue();
        if (success > 0) toast.success(`${success} action(s) synchronisée(s).`);
        if (failed > 0) toast.error(`${failed} action(s) n'ont pas pu être synchronisées.`);
        refreshCount();
      }
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    listeners.add(refreshCount);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      listeners.delete(refreshCount);
    };
  }, [refreshCount]);

  return { isOnline, pendingCount };
}
