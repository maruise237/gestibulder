"use client"

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, Clock } from 'lucide-react';
import { upsertPointage } from '@/lib/server/pointage.actions';
import { PointageStatut, PointageWithOuvrier } from '@/types/pointage';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface PointageTableProps {
  workers: any[];
  existingPointages: PointageWithOuvrier[];
  chantierId: string;
  date: string;
}

export function PointageTable({ workers, existingPointages, chantierId, date }: PointageTableProps) {
  const queryClient = useQueryClient();
  const [localState, setLocalState] = useState<Record<string, { statut: PointageStatut; heure_arrivee: string }>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialiser le state local avec les pointages existants
  useEffect(() => {
    const initialState: Record<string, { statut: PointageStatut; heure_arrivee: string }> = {};
    existingPointages.forEach(p => {
      initialState[p.ouvrier_id] = {
        statut: p.statut,
        heure_arrivee: p.heure_arrivee || '08:00'
      };
    });
    setLocalState(initialState);
  }, [existingPointages]);

  const updateLocal = (ouvrierId: string, updates: Partial<{ statut: PointageStatut; heure_arrivee: string }>) => {
    setLocalState(prev => ({
      ...prev,
      [ouvrierId]: {
        statut: prev[ouvrierId]?.statut || 'absent',
        heure_arrivee: prev[ouvrierId]?.heure_arrivee || '08:00',
        ...updates
      }
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const promises = Object.entries(localState).map(([ouvrier_id, data]) =>
        upsertPointage({
          ouvrier_id,
          chantier_id: chantierId,
          date,
          statut: data.statut,
          heure_arrivee: data.heure_arrivee
        })
      );

      await Promise.all(promises);
      toast.success("Pointages enregistrés avec succès");
      queryClient.invalidateQueries({ queryKey: ['pointages', chantierId, date] });
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3">
        {workers.map((worker) => {
          const state = localState[worker.id] || { statut: 'absent', heure_arrivee: '08:00' };
          const taux = worker.taux_journalier || 0;
          const salaire = state.statut === 'present' ? taux : state.statut === 'demi_journee' ? taux / 2 : 0;

          return (
            <Card key={worker.id} className="p-4 border-l-8 border-l-indigo-600 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    {worker.nom_complet.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-foreground uppercase text-sm">{worker.nom_complet}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{worker.metier}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex bg-muted p-1 rounded-lg">
                    {[
                      { val: 'present', label: 'P', color: 'bg-emerald-500 text-white' },
                      { val: 'demi_journee', label: 'D', color: 'bg-orange-500 text-white' },
                      { val: 'absent', label: 'A', color: 'bg-destructive text-white' }
                    ].map((btn) => (
                      <button
                        key={btn.val}
                        onClick={() => updateLocal(worker.id, { statut: btn.val as PointageStatut })}
                        className={cn(
                          "w-10 h-8 rounded-md text-xs font-bold transition-all",
                          state.statut === btn.val ? btn.color : "text-muted-foreground hover:bg-background"
                        )}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {state.statut !== 'absent' && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <Input
                        type="time"
                        className="h-9 w-24 text-xs font-bold"
                        value={state.heure_arrivee}
                        onChange={(e) => updateLocal(worker.id, { heure_arrivee: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="min-w-[80px] text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Salaire</p>
                    <p className="font-black text-indigo-600 text-sm">
                      {salaire.toLocaleString('fr-FR')} <span className="text-[10px]">FCFA</span>
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <Button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="rounded-xl px-8 h-12 font-black shadow-lg"
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
          ENREGISTRER TOUT
        </Button>
      </div>
    </div>
  );
}
