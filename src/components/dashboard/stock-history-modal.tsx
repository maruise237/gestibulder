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
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[600px]">
        <DialogHeader className="bg-muted/30 border-b p-6 sm:p-8 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground rounded-2xl p-3 shadow-lg">
              <Clock size={24} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight">
                Historique des Mouvements
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/70 text-xs font-black tracking-widest uppercase">
                {material.nom}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-6 sm:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mb-4 animate-spin text-primary" size={32} />
              <p className="text-[10px] font-black tracking-widest uppercase">Récupération du registre...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Archive size={48} className="mb-4 opacity-10" />
              <p className="text-sm font-bold italic">Aucun mouvement enregistré pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((mov) => (
                <div
                  key={mov.id}
                  className="group flex items-center justify-between rounded-2xl border border-muted bg-muted/20 p-5 transition-all hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm',
                        mov.type_mouvement === 'entree'
                          ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                          : 'border-red-100 bg-red-50 text-red-600'
                      )}
                    >
                      {mov.type_mouvement === 'entree' ? (
                        <TrendingUp size={18} strokeWidth={2.5} />
                      ) : (
                        <TrendingDown size={18} strokeWidth={2.5} />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-black tracking-tight text-foreground">
                        {mov.type_mouvement === 'entree' ? 'Entrée de Stock' : 'Consommation'}
                      </div>
                      <div className="mt-1 text-[9px] font-black tracking-widest text-muted-foreground uppercase">
                        {formatDate(mov.date)} • {mov.usage || mov.fournisseur || 'Général'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={cn(
                        'text-lg font-black tracking-tighter',
                        mov.type_mouvement === 'entree' ? 'text-emerald-600' : 'text-red-600'
                      )}
                    >
                      {mov.type_mouvement === 'entree' ? '+' : '-'}
                      {mov.quantite} {material.unite}
                    </div>
                    <div className="mt-0.5 text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                      Traité
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-muted/30 border-t p-6 sm:p-8">
          <Button variant="outline" className="h-12 w-full rounded-xl font-bold" onClick={onClose}>
            Fermer l'Historique
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
