'use client';

import React, { useState } from 'react';
import { createEquipment } from '@/lib/server/equipment.actions';
import { Loader2, Plus, Truck, Tag, Hash, ShieldCheck } from 'lucide-react';
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
        <Button className="font-bold shadow-lg">
        <Plus className="mr-2 h-4 w-4" strokeWidth={3} />
        Nouvel Équipement
      </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[500px]">
        <DialogHeader className="bg-muted/30 border-b p-8 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground shadow-primary/20 rounded-2xl p-3 shadow-lg">
              <Truck size={24} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight">
                Nouvel Équipement
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/70 text-xs font-bold tracking-widest uppercase">
                Inventaire du parc matériel
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
                <ShieldCheck size={14} className="text-primary" /> Désignation du matériel
              </Label>
              <Input
                id="nom"
                name="nom"
                required
                placeholder="Ex: Pelleteuse Caterpillar 320"
                className="bg-muted/20 border-muted focus-visible:ring-primary/20 h-12 rounded-xl px-4 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                  <Tag size={14} className="text-primary" /> Catégorie
                </Label>
                <Select name="categorie" required>
                  <SelectTrigger className="bg-muted/20 border-muted focus:ring-primary/20 h-12 rounded-xl px-4 font-bold">
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent className="border-muted rounded-xl">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="rounded-lg py-3 font-bold">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor="numero_serie"
                  className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
                >
                  <Hash size={14} className="text-primary" /> N° de série
                </Label>
                <Input
                  id="numero_serie"
                  name="numero_serie"
                  placeholder="SN-XXXXXX"
                  className="bg-muted/20 border-muted focus-visible:ring-primary/20 h-12 rounded-xl px-4 font-bold"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border-destructive/20 animate-in fade-in slide-in-from-top-2 flex items-center gap-3 rounded-xl border p-4">
              <div className="bg-destructive h-1.5 w-1.5 animate-pulse rounded-full" />
              <p className="text-destructive text-xs font-black tracking-widest uppercase">
                {error}
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
              disabled={isLoading}
              className="shadow-primary/20 h-12 flex-1 rounded-xl font-bold shadow-lg"
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
