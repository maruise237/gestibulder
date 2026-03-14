'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPhases, createPhase, updatePhase, deletePhase } from '@/lib/server/phase.actions';
import { useApp } from '@/lib/context/app-context';
import { Calendar, ChevronRight, Clock, CheckCircle2, AlertCircle, Plus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from '@/components/ui/dialog';

export default function PlanningPage() {
  const { selectedProjectId } = useApp();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: phases = [], isLoading } = useQuery({
    queryKey: ['phases', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const res = await getPhases(selectedProjectId);
      return res.phases || [];
    },
    enabled: !!selectedProjectId,
  });

  const createMutation = useMutation({
    mutationFn: createPhase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases', selectedProjectId] });
      setModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updatePhase(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['phases', selectedProjectId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePhase,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['phases', selectedProjectId] }),
  });

  const terminees = phases.filter((p: any) => p.statut === 'termine').length;
  const enCours = phases.find((p: any) => p.statut === 'en_cours');
  const avgProgress = phases.length > 0
    ? Math.round(phases.reduce((sum: number, p: any) => sum + (p.avancement_pct || 0), 0) / phases.length)
    : 0;

  const handleCreatePhase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      chantier_id: selectedProjectId,
      nom: fd.get('nom') as string,
      date_debut: fd.get('date_debut') as string,
      date_fin_prevue: fd.get('date_fin_prevue') as string,
      ordre: phases.length,
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl">Planning</h1>
          <p className="hidden text-size-xs font-medium text-muted-foreground sm:block">
            Phases et avancement du projet actif.
          </p>
        </div>
        {selectedProjectId && (
          <Button size="sm" onClick={() => setModalOpen(true)} className="text-[10px] font-semibold uppercase tracking-widest">
            <Plus className="mr-1.5 h-4 w-4" /> Nouvelle Phase
          </Button>
        )}
      </div>

      {!selectedProjectId ? (
        <Card className="border-2 border-dashed border-border bg-muted/30 py-16 text-center">
          <div className="mb-4 inline-flex rounded-xl bg-background p-4 text-muted-foreground shadow-sm">
            <Calendar size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-size-xl font-semibold tracking-tight text-foreground">Sélectionnez un chantier</h2>
          <p className="text-size-sm text-muted-foreground mt-1">Veuillez choisir un chantier pour voir son planning opérationnel.</p>
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-4 border-l-4 border-l-primary">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Progression Globale</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-bold">{avgProgress}%</span>
              </div>
              <Progress value={avgProgress} className="mt-3" />
            </Card>
            <Card className="p-4 border-l-4 border-l-emerald-500">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Phases Terminées</p>
              <p className="mt-2 text-2xl font-bold">{terminees} / {phases.length}</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-amber-500">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Phase En Cours</p>
              <p className="mt-2 text-sm font-bold truncate">{(enCours as any)?.nom || 'Aucune'}</p>
            </Card>
          </div>

          {phases.length === 0 ? (
            <Card className="border-2 border-dashed border-border bg-muted/30 py-12 text-center">
              <p className="text-muted-foreground font-medium mb-4">Aucune phase définie pour ce chantier.</p>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Créer la première phase
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {phases.map((phase: any) => (
                <Card key={phase.id} className="group relative overflow-hidden transition-all hover:border-primary/50">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-6">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                      phase.statut === 'termine' ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                      phase.statut === 'en_cours' ? "bg-primary/5 border-primary/20 text-primary animate-pulse" :
                      phase.statut === 'bloque' ? "bg-destructive/10 border-destructive/20 text-destructive" :
                      "bg-muted border-transparent text-muted-foreground"
                    )}>
                      {phase.statut === 'termine' ? <CheckCircle2 size={20} /> :
                       phase.statut === 'en_cours' ? <Clock size={20} /> :
                       <div className="h-2 w-2 rounded-full bg-current" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground truncate">{phase.nom}</h4>
                        <select
                          value={phase.statut}
                          onChange={(e) => updateMutation.mutate({ id: phase.id, data: { statut: e.target.value } })}
                          className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border bg-transparent cursor-pointer"
                        >
                          <option value="planifie">Planifié</option>
                          <option value="en_cours">En cours</option>
                          <option value="termine">Terminé</option>
                          <option value="bloque">Bloqué</option>
                        </select>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground font-medium">
                        {phase.date_debut && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(phase.date_debut).toLocaleDateString()} → {phase.date_fin_prevue ? new Date(phase.date_fin_prevue).toLocaleDateString() : 'N/A'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-full sm:w-48 space-y-2">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-muted-foreground uppercase">Avancement</span>
                        <span className="text-primary">{phase.avancement_pct || 0}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={phase.avancement_pct || 0}
                        onChange={(e) => updateMutation.mutate({
                          id: phase.id,
                          data: { avancement_pct: Number(e.target.value) }
                        })}
                        className="w-full accent-primary"
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        if (confirm('Supprimer cette phase ?')) deleteMutation.mutate(phase.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal création phase */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader className="bg-muted/30 border-b p-6">
            <DialogTitle>Nouvelle Phase</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePhase} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Nom de la phase</label>
              <Input name="nom" required placeholder="Ex: Fondations" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Date début</label>
                <Input name="date_debut" type="date" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Date fin prévue</label>
                <Input name="date_fin_prevue" type="date" />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending} className="flex-1">
                {createMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
