'use client';

import { useOfflineSync } from '@/lib/offline-sync';
import { WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Bandeau discret affiché quand l'app est hors ligne, ou qu'il reste des
 * actions en attente de synchronisation. Monté une seule fois globalement
 * (dans DashboardShell) : la synchronisation elle-même se fait via le hook
 * useOfflineSync, ce composant n'est que l'indicateur visuel.
 */
export function OfflineIndicator() {
  const { isOnline, pendingCount } = useOfflineSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium',
        !isOnline ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff size={14} />
          Hors ligne — les actions seront synchronisées automatiquement à la reconnexion
          {pendingCount > 0 && ` (${pendingCount} en attente)`}
        </>
      ) : (
        <>
          <RefreshCw size={14} className="animate-spin" />
          Synchronisation de {pendingCount} action(s) en attente...
        </>
      )}
    </div>
  );
}
