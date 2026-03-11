'use client';

import React, { useState, useEffect } from 'react';
import { updateEquipmentStatus } from '@/lib/server/equipment.actions';
import { getProjects } from '@/lib/server/project.actions';
import { Loader2, ArrowUpRight } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function DeployEquipmentModal({
  equipment,
  onDeployed
}: {
  equipment: Equipment;
  onDeployed?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      const res = await getProjects();
      if (res.projects) setProjects(res.projects);
    };
    if (isOpen) fetchProjects();
  }, [isOpen]);

  const handleDeploy = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const etat = formData.get('etat') as Equipment['etat'];

    const result = await updateEquipmentStatus(equipment.id, etat);

    if (result.error) {
      setError(result.error);
    } else {
      setIsOpen(false);
      if (onDeployed) onDeployed();
    }
    setIsSubmitting(false);
  };

  const handleChantierChange = (val: string | null) => {};

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Mettre à jour l'état
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>État du matériel</DialogTitle>
          <DialogDescription>
            Mettre à jour l'état opérationnel de {equipment.nom}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleDeploy} className="space-y-4 pt-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="etat">Statut opérationnel</Label>
              <Select name="etat" defaultValue={equipment.etat} onValueChange={handleChantierChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un état" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible (Parc matériel)</SelectItem>
                  <SelectItem value="en_service">En Service (Affecté)</SelectItem>
                  <SelectItem value="en_transit">En Transit</SelectItem>
                  <SelectItem value="en_maintenance">Maintenance</SelectItem>
                  <SelectItem value="hors_service">Hors Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive mt-2">{error}</p>}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
