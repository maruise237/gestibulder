'use client';

import React, { useEffect, useState } from 'react';
import { getMaterialHistory } from '@/lib/server/stock.actions';
import { Loader2, TrendingUp, TrendingDown, Archive } from 'lucide-react';
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Historique : {material.nom}</DialogTitle>
          <DialogDescription>
            Registre complet des mouvements de stock.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="mb-2 animate-spin text-muted-foreground" size={24} />
              <p className="text-sm text-muted-foreground">Chargement du registre...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Archive className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground italic">Aucun mouvement enregistré.</p>
            </div>
          ) : (
            <div className="space-y-3 pr-2">
              {history.map((mov) => (
                <div
                  key={mov.id}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      mov.type_mouvement === 'entree' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                    )}>
                      {mov.type_mouvement === 'entree' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    </div>
                    <div>
                      <p className="font-medium">
                        {mov.type_mouvement === 'entree' ? 'Entrée' : 'Consommation'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(mov.date)} • {mov.usage || mov.fournisseur || 'Général'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-bold",
                      mov.type_mouvement === 'entree' ? "text-emerald-600" : "text-destructive"
                    )}>
                      {mov.type_mouvement === 'entree' ? '+' : '-'}{mov.quantite} {material.unite}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
