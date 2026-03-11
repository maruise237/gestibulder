'use client';

import React, { useState } from 'react';
import { createProject } from '@/lib/server/project.actions';
import { Loader2, Plus, HardHat } from 'lucide-react';
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
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      const previousProjects = queryClient.getQueryData(['projects']);
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
        <Button className="font-bold shadow-lg">
          <Plus className="h-4 w-4 md:mr-2" strokeWidth={3} />
          <span className="hidden md:inline">Nouveau Projet</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="bg-muted/30 border-b p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground rounded-md p-2">
              <HardHat size={20} />
            </div>
            <div className="space-y-1">
              <DialogTitle>Lancer un Projet</DialogTitle>
              <DialogDescription>Nouveau chantier de construction</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Identité du Projet</Label>
                <Input
                  id="nom"
                  name="nom"
                  required
                  placeholder="Ex: Résidence Skyline"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse">Localisation</Label>
                <Input
                  id="adresse"
                  name="adresse"
                  required
                  placeholder="Adresse complète du chantier"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget_total">
                    Budget ({enterprise?.devise || 'DZD'})
                  </Label>
                  <Input
                    id="budget_total"
                    name="budget_total"
                    type="number"
                    min="0"
                    required
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_debut">Date de début</Label>
                  <Input
                    id="date_debut"
                    name="date_debut"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_fin_prevue">Fin prévue</Label>
                <Input
                  id="date_fin_prevue"
                  name="date_fin_prevue"
                  type="date"
                />
              </div>
            </div>

            {mutation.isError && (
              <div className="bg-destructive/10 border-destructive/20 mt-4 flex items-center gap-3 rounded-md border p-4 text-destructive text-xs">
                {mutation.error instanceof Error ? mutation.error.message : 'Une erreur est survenue'}
              </div>
            )}
          </div>

          <DialogFooter className="p-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1"
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
