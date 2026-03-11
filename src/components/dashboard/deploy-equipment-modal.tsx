'use client';

import React, { useState, useEffect } from 'react';
import { deployEquipment } from '@/lib/server/equipment.actions';
import { getProjects } from '@/lib/server/project.actions';
import {
  Loader2,
  Calendar,
  HardHat,
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
          className="group/btn h-10 rounded-xl border-zinc-200 px-4 hover:border-indigo-500"
          disabled={equipment.etat !== 'disponible'}
        >
          <ArrowRightLeft
            size={14}
            className="text-zinc-400 transition-colors group-hover/btn:text-indigo-600"
          />
          <span className="ml-2 text-[10px] font-black tracking-widest uppercase">
            {equipment.etat === 'disponible' ? 'Déployer' : 'Occupé'}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[500px]">
        <DialogHeader className="bg-muted/30 border-b p-6 sm:p-8 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground rounded-2xl p-3 shadow-lg">
              <ArrowRightLeft size={24} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight">
                Déploiement Matériel
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/70 text-xs font-black tracking-widest uppercase">
                Affectation sur chantier
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-8">
          <div className="rounded-3xl border border-primary/10 bg-primary/5 p-6 text-center">
            <p className="mb-2 text-[10px] font-black tracking-[0.2em] text-primary/60 uppercase">
              Équipement identifié
            </p>
            <p className="text-3xl font-black tracking-tight text-foreground">{equipment.nom}</p>
            <p className="mt-1 text-[11px] font-black tracking-widest text-muted-foreground uppercase">
              Catégorie: {equipment.categorie}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2.5">
              <Label className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                <HardHat size={14} className="text-primary" /> Chantier de destination
              </Label>
              <Select value={selectedProject} onValueChange={(val) => val && setSelectedProject(val)}>
                <SelectTrigger className="bg-muted/20 border-muted h-12 rounded-xl px-4 font-bold">
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

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2.5">
                <Label className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                  <Calendar size={14} className="text-primary" /> Date de début
                </Label>
                <Input
                  name="date_debut"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="bg-muted/20 border-muted focus-visible:ring-primary/20 h-12 rounded-xl px-4 font-bold"
                />
              </div>
              <div className="space-y-2.5">
                <Label className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                  <Calendar size={14} className="text-primary" /> Fin prévue
                </Label>
                <Input
                  name="date_fin"
                  type="date"
                  required
                  className="bg-muted/20 border-muted focus-visible:ring-primary/20 h-12 rounded-xl px-4 font-bold"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border-destructive/20 flex items-center gap-3 rounded-xl border p-4">
              <div className="bg-destructive h-1.5 w-1.5 animate-pulse rounded-full" />
              <p className="text-destructive text-xs font-black tracking-widest uppercase">{error}</p>
            </div>
          )}

          <DialogFooter className="gap-3 pt-4 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="h-12 flex-1 rounded-xl font-bold"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              className="h-12 flex-1 rounded-xl font-bold shadow-lg"
            >
              Confirmer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
