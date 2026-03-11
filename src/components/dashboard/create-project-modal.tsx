'use client';

import React, { useState } from 'react';
import { createProject } from '@/lib/server/project.actions';
import { Loader2, Plus, HardHat, MapPin, Target, Calendar, Calculator } from 'lucide-react';
import { ProjectStatus } from '@/types/project';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/lib/context/app-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function CreateProjectModal({ onProjectCreated }: { onProjectCreated?: () => void }) {
  const { enterprise } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createProject,
    onMutate: async (newProject) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['projects'] });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData(['projects']);

      // Optimistically update to the new value
      queryClient.setQueryData(['projects'], (old: any[] | undefined) => [
        ...(old || []),
        {
          id: 'temp-id-' + Date.now(),
          ...newProject,
          created_at: new Date().toISOString(),
          avancement_pct: 0,
          statut: 'preparation',
        },
      ]);

      return { previousProjects };
    },
    onError: (err, newProject, context) => {
      queryClient.setQueryData(['projects'], context?.previousProjects);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    },
    onSuccess: () => {
      setIsOpen(false);
      if (onProjectCreated) onProjectCreated();
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nom: formData.get('nom') as string,
      adresse: formData.get('adresse') as string,
      date_debut: formData.get('date_debut') as string,
      date_fin_prevue: (formData.get('date_fin_prevue') as string) || null,
      budget_total: parseFloat(formData.get('budget_total') as string) || 0,
      statut: 'preparation' as ProjectStatus,
      avancement_pct: 0,
    };

    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Projet
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[500px]">
        <DialogHeader className="bg-muted/30 border-b p-8 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground shadow-primary/20 rounded-2xl p-3 shadow-lg">
              <HardHat size={24} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight">
                Lancer un Projet
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/70 text-xs font-bold tracking-widest uppercase">
                Nouveau chantier de construction
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-8 pt-6">
          <div className="grid gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="nom"
                className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
              >
                <Target size={14} className="text-primary" /> Identité du Projet
              </Label>
              <Input
                id="nom"
                name="nom"
                required
                placeholder="Ex: Résidence Skyline"
                className="bg-muted/20 border-muted focus-visible:ring-primary/20 h-12 rounded-xl px-4 font-bold"
              />
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="adresse"
                className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
              >
                <MapPin size={14} className="text-primary" /> Localisation
              </Label>
              <Input
                id="adresse"
                name="adresse"
                required
                placeholder="Adresse complète du chantier"
                className="bg-muted/20 border-muted focus-visible:ring-primary/20 h-12 rounded-xl px-4 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor="budget_total"
                  className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
                >
                  <Calculator size={14} className="text-primary" /> Budget ({enterprise?.devise || 'DZD'})
                </Label>
                <Input
                  id="budget_total"
                  name="budget_total"
                  type="number"
                  min="0"
                  required
                  placeholder="0.00"
                  className="bg-muted/20 border-muted focus-visible:ring-primary/20 h-12 rounded-xl px-4 font-bold"
                />
              </div>
              <div className="space-y-2.5">
                <Label
                  htmlFor="date_debut"
                  className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
                >
                  <Calendar size={14} className="text-primary" /> Date de début
                </Label>
                <Input
                  id="date_debut"
                  name="date_debut"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="bg-muted/20 border-muted focus-visible:ring-primary/20 h-12 rounded-xl px-4 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="date_fin_prevue"
                className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
              >
                <Calendar size={14} className="text-primary" /> Fin prévue
              </Label>
              <Input
                id="date_fin_prevue"
                name="date_fin_prevue"
                type="date"
                className="bg-muted/20 border-muted focus-visible:ring-primary/20 h-12 rounded-xl px-4 font-bold"
              />
            </div>
          </div>

          {mutation.isError && (
            <div className="bg-destructive/10 border-destructive/20 animate-in fade-in slide-in-from-top-2 flex items-center gap-3 rounded-xl border p-4">
              <div className="bg-destructive h-1.5 w-1.5 animate-pulse rounded-full" />
              <p className="text-destructive text-xs font-black tracking-widest uppercase">
                {mutation.error instanceof Error ? mutation.error.message : 'Une erreur est survenue'}
              </p>
            </div>
          )}

          <DialogFooter className="gap-3 pt-4 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-muted hover:bg-muted/50 h-12 flex-1 rounded-xl font-bold"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="shadow-primary/20 h-12 flex-1 rounded-xl font-bold shadow-lg"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer le Projet'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
