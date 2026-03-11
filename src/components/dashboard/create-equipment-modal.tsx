'use client';

import React, { useState } from 'react';
import { createEquipment } from '@/lib/server/equipment.actions';
import { Loader2, Plus, Truck } from 'lucide-react';
import { NewEquipment } from '@/types/equipment';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORIES = [
  'Engin de terrassement',
  'Véhicule de transport',
  'Matériel de levage',
  'Outillage électroportatif',
  'Échafaudage',
  'Autre',
];

export function CreateEquipmentModal({ onEquipmentCreated }: { onEquipmentCreated: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: NewEquipment = {
      nom: formData.get('nom') as string,
      categorie: formData.get('categorie') as string,
      numero_serie: formData.get('numero_serie') as string,
      etat: 'disponible',
    };

    const result = await createEquipment(data);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setIsOpen(false);
      setIsLoading(false);
      onEquipmentCreated();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel Équipement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader className="bg-muted/30 border-b p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground rounded-md p-2">
              <Truck size={20} />
            </div>
            <div className="space-y-1">
              <DialogTitle>Nouvel Équipement</DialogTitle>
              <DialogDescription>Inventaire du parc matériel</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Désignation du matériel</Label>
                <Input
                  id="nom"
                  name="nom"
                  required
                  placeholder="Ex: Pelleteuse Caterpillar 320"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select name="categorie" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero_serie">N° de série</Label>
                  <Input
                    id="numero_serie"
                    name="numero_serie"
                    placeholder="SN-XXXXXX"
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
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
