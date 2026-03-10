'use client';

import React, { useState } from 'react';
import { createMaterial } from '@/lib/server/stock.actions';
import { Loader2, Plus, Package, Ruler, AlertTriangle } from 'lucide-react';
import { NewMaterial } from '@/types/stock';
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

const COMMON_MATERIALS = [
  { name: 'Ciment', unit: 'Sacs' },
  { name: 'Sable', unit: 'm³' },
  { name: 'Gravier', unit: 'm³' },
  { name: 'Acier 8mm', unit: 'Barres' },
  { name: 'Acier 10mm', unit: 'Barres' },
  { name: 'Acier 12mm', unit: 'Barres' },
  { name: 'Briques 8 trous', unit: 'Unités' },
  { name: 'Briques 12 trous', unit: 'Unités' },
  { name: 'Bois de coffrage', unit: 'm²' },
  { name: 'Peinture Blanche', unit: 'Litres' },
];

export function CreateMaterialModal({
  chantierId,
  onMaterialCreated,
}: {
  chantierId: string;
  onMaterialCreated: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: NewMaterial = {
      chantier_id: chantierId,
      nom: formData.get('nom') as string,
      unite: formData.get('unite') as string,
      seuil_alerte: Number(formData.get('seuil_alerte')) || 0,
    };

    const result = await createMaterial(data);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setIsOpen(false);
      setIsLoading(false);
      onMaterialCreated();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold shadow-lg">
        <Plus className="mr-2 h-4 w-4" strokeWidth={3} />
        Nouveau Matériau
      </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[500px]">
        <DialogHeader className="bg-muted/30 border-b p-8 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground shadow-primary/20 rounded-2xl p-3 shadow-lg">
              <Package size={24} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight">
                Ajout Matériau
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/70 text-xs font-bold tracking-widest uppercase">
                Gestion de l'inventaire
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
                <Package size={14} className="text-primary" /> Désignation du Matériau
              </Label>
              <Input
                id="nom"
                name="nom"
                required
                list="common-materials"
                placeholder="Ex: Ciment Portland"
                className="bg-muted/20 border-muted focus-visible:ring-primary/20 h-12 rounded-xl px-4 font-bold"
              />
              <datalist id="common-materials">
                {COMMON_MATERIALS.map((m) => (
                  <option key={m.name} value={m.name} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor="unite"
                  className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
                >
                  <Ruler size={14} className="text-primary" /> Unité Standard
                </Label>
                <Input
                  id="unite"
                  name="unite"
                  required
                  placeholder="Sacs, m³, kg..."
                  className="bg-muted/20 border-muted focus-visible:ring-primary/20 h-12 rounded-xl px-4 font-bold"
                />
              </div>
              <div className="space-y-2.5">
                <Label
                  htmlFor="seuil_alerte"
                  className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
                >
                  <AlertTriangle size={14} className="text-primary" /> Seuil d'Alerte
                </Label>
                <Input
                  id="seuil_alerte"
                  name="seuil_alerte"
                  type="number"
                  defaultValue="5"
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
