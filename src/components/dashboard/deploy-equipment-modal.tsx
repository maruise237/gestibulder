'use client';

import React, { useState, useEffect } from 'react';
import { deployEquipment } from '@/lib/server/equipment.actions';
import { getProjects } from '@/lib/server/project.actions';
import {
  Loader2,
  ArrowRightLeft,
} from 'lucide-react';
import { Equipment } from '@/types/equipment';
import { Project } from '@/types/project';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DeployEquipmentModal({
  equipment,
  onDeployed,
}: {
  equipment: Equipment;
  onDeployed: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const fetchProjects = async () => {
        const res = await getProjects();
        if (res.projects) setProjects(res.projects);
      };
      fetchProjects();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      equipement_id: equipment.id,
      chantier_id: selectedProject,
      date_debut: formData.get('date_debut') as string,
      date_fin: formData.get('date_fin') as string,
    };

    if (!data.chantier_id) {
      setError('Veuillez sélectionner un chantier');
      setIsLoading(false);
      return;
    }

    const result = await deployEquipment(data);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setIsOpen(false);
      setIsLoading(false);
      onDeployed();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-border px-4 hover:border-primary"
          disabled={equipment.etat !== 'disponible'}
        >
          <ArrowRightLeft size={14} className="text-muted-foreground" />
          <span className="ml-2 text-xs font-medium">
            {equipment.etat === 'disponible' ? 'Déployer' : 'Occupé'}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[500px]">
        <DialogHeader className="border-b p-6 sm:p-8 pb-6">
          <DialogTitle className="font-display text-2xl font-medium">
            Déploiement matériel
          </DialogTitle>
          <DialogDescription className="text-xs">
            Affectation sur chantier
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-8">
          <div className="border border-border p-4 flex items-center justify-between">
            <div>
              <p className="text-size-base font-medium text-foreground">{equipment.nom}</p>
              <p className="text-xs text-muted-foreground">
                {equipment.categorie}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Chantier de destination</Label>
              <Select value={selectedProject} onValueChange={(val) => val && setSelectedProject(val)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Choisir un chantier">
                    {(value: string) => projects.find((p) => p.id === value)?.nom || 'Choisir un chantier'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input
                  name="date_debut"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="font-tabular"
                />
              </div>
              <div className="space-y-2">
                <Label>Fin prévue</Label>
                <Input
                  name="date_fin"
                  type="date"
                  required
                  className="font-tabular"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border-destructive/20 flex items-center gap-3 rounded-md border p-4">
              <p className="text-destructive text-xs font-medium">{error}</p>
            </div>
          )}

          <DialogFooter className="gap-3 pt-4 sm:gap-0">
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
              isLoading={isLoading}
              className="flex-1"
            >
              Confirmer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
