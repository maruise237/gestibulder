'use client';

import React, { useEffect, useState } from 'react';
import { getMaterialHistory } from '@/lib/server/stock.actions';
import { Loader2, Archive, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Material, StockMovement } from '@/types/stock';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn, formatDate } from '@/lib/utils';

export function StockHistoryModal({
  material,
  onClose,
}: {
  material: Material;
  onClose: () => void;
}) {
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const res = await getMaterialHistory(material.id);
      if (res.history) setHistory(res.history);
      setIsLoading(false);
    };
    fetchHistory();
  }, [material.id]);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="bg-muted/30 border-b p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground rounded-md p-2">
              <Clock size={20} />
            </div>
            <div className="space-y-1">
              <DialogTitle>Historique des Mouvements</DialogTitle>
              <DialogDescription>{material.nom}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mb-4 animate-spin text-primary" size={24} />
                <p className="text-[10px] font-semibold tracking-widest uppercase">
                  Récupération du registre...
                </p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Archive size={32} className="mb-4 opacity-10" />
                <p className="text-sm font-medium italic">Aucun mouvement enregistré pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((mov) => (
                  <div
                    key={mov.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-md border',
                          mov.type_mouvement === 'entree'
                            ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                            : 'border-red-100 bg-red-50 text-red-600'
                        )}
                      >
                        {mov.type_mouvement === 'entree' ? (
                          <TrendingUp size={16} />
                        ) : (
                          <TrendingDown size={16} />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {mov.type_mouvement === 'entree' ? 'Entrée de Stock' : 'Consommation'}
                        </div>
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                          {formatDate(mov.date)} • {mov.usage || mov.fournisseur || 'Général'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={cn(
                          'text-lg font-semibold tracking-tight',
                          mov.type_mouvement === 'entree' ? 'text-emerald-600' : 'text-red-600'
                        )}
                      >
                        {mov.type_mouvement === 'entree' ? '+' : '-'}
                        {mov.quantite} {material.unite}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="p-6">
            <Button variant="outline" className="w-full" onClick={onClose}>
              Fermer l&apos;Historique
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
