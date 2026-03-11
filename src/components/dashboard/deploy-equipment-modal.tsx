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
          disabled={equipment.etat !== 'disponible'}
        >
          <ArrowRightLeft
            size={14}
            className="mr-2"
          />
          {equipment.etat === 'disponible' ? 'Déployer' : 'Occupé'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="bg-muted/30 border-b p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground rounded-md p-2">
              <ArrowRightLeft size={20} />
            </div>
            <div className="space-y-1">
              <DialogTitle>Déploiement Matériel</DialogTitle>
              <DialogDescription>Affectation sur chantier</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 text-center mb-6">
              <p className="mb-1 text-[10px] font-semibold tracking-widest text-primary/60 uppercase">
                Équipement identifié
              </p>
              <p className="text-xl font-semibold tracking-tight text-foreground">{equipment.nom}</p>
              <p className="mt-1 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                {equipment.categorie}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Chantier de destination</Label>
                <Select value={selectedProject} onValueChange={(val) => val && setSelectedProject(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un chantier" />
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date de début</Label>
                  <Input
                    name="date_debut"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fin prévue</Label>
                  <Input
                    name="date_fin"
                    type="date"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border-destructive/20 mt-4 flex items-center gap-3 rounded-md border p-4 text-destructive text-xs">
                {error}
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
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmation...
                </>
              ) : (
                'Confirmer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
