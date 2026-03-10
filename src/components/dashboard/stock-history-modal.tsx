'use client';

import React, { useEffect, useState } from 'react';
import { getMaterialHistory } from '@/lib/server/stock.actions';
import { Loader2, X, Archive, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Material, StockMovement } from '@/types/stock';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm duration-300">
      <Card
        className="shadow-elevated flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden p-0"
        padding="none"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 bg-zinc-50/30 p-10">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-zinc-950 p-2 text-white">
              <Clock size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-zinc-950">Movement History</h2>
              <p className="mt-1 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                {material.nom}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 transition-all hover:bg-white hover:text-zinc-950"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {isLoading ? (
            <div className="flex h-full flex-col items-center justify-center text-zinc-400">
              <Loader2 className="mb-4 animate-spin" size={32} />
              <p className="font-bold">Fetching ledger...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-zinc-400">
              <Archive size={48} className="mb-4 opacity-10" />
              <p className="font-bold italic">No movements recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((mov) => (
                <div
                  key={mov.id}
                  className="group flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 p-6 transition-all hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center gap-5">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl border',
                        mov.type_mouvement === 'entree'
                          ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                          : 'border-red-100 bg-red-50 text-red-600'
                      )}
                    >
                      {mov.type_mouvement === 'entree' ? (
                        <TrendingUp size={18} />
                      ) : (
                        <TrendingDown size={18} />
                      )}
                    </div>
                    <div>
                      <div className="font-black tracking-tight text-zinc-950">
                        {mov.type_mouvement === 'entree' ? 'Stock Entry' : 'Consumption'}
                      </div>
                      <div className="mt-1 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                        {formatDate(mov.date)} • {mov.usage || mov.fournisseur || 'General'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={cn(
                        'text-lg font-black tracking-tight',
                        mov.type_mouvement === 'entree' ? 'text-emerald-600' : 'text-red-600'
                      )}
                    >
                      {mov.type_mouvement === 'entree' ? '+' : '-'}
                      {mov.quantite} {material.unite}
                    </div>
                    <div className="mt-1 text-[10px] font-black text-zinc-400 uppercase">
                      Processed
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-zinc-100 bg-zinc-50/30 p-8">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Close History
          </Button>
        </div>
      </Card>
    </div>
  );
}
