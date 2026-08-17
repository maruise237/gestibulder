'use client';

import React, { useEffect, useState } from 'react';
import { getMaterialHistory } from '@/lib/server/stock.actions';
import { Loader2, Archive } from 'lucide-react';
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
        <DialogHeader className="border-b p-6 sm:p-8 pb-6">
          <DialogTitle className="font-display text-2xl font-medium">
            Historique des mouvements
          </DialogTitle>
          <DialogDescription className="text-xs">
            {material.nom}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-6 sm:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mb-4 animate-spin text-primary" size={32} />
              <p className="text-xs">Récupération du registre...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Archive size={32} className="mb-4 opacity-20" />
              <p className="text-xs">Aucun mouvement enregistré pour le moment.</p>
            </div>
          ) : (
            <div className="border border-border divide-y divide-border">
              {history.map((mov) => (
                <div
                  key={mov.id}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-muted/30"
                >
                  <div>
                    <div className="text-size-sm font-medium text-foreground">
                      {mov.type_mouvement === 'entree' ? 'Entrée de stock' : 'Consommation'}
                    </div>
                    <div className="font-tabular mt-1 text-xs text-muted-foreground">
                      {formatDate(mov.date_operation)} · {mov.usage || mov.fournisseur || 'Général'}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'font-tabular text-size-sm font-medium',
                      mov.type_mouvement === 'entree' ? 'text-success' : 'text-destructive'
                    )}
                  >
                    {mov.type_mouvement === 'entree' ? '+' : '−'}
                    {mov.quantite} {material.unite}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-6 sm:p-8">
          <Button variant="outline" className="h-11 w-full" onClick={onClose}>
            Fermer l'historique
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
