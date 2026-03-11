'use client';

import React, { useState } from 'react';
import { createMaterial } from '@/lib/server/stock.actions';
import { Loader2, Plus, Package, Ruler, AlertTriangle, TrendingUp } from 'lucide-react';
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

export function CreateMaterialModal({
  onMaterialCreated,
  chantierId
}: {
  onMaterialCreated: () => void;
  chantierId?: string;
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
      nom: formData.get('nom') as string,
      unite: formData.get('unite') as string,
      seuil_alerte: Number(formData.get('seuil_alerte')),
      stock_actuel: Number(formData.get('stock_initial')) || 0,
    };

    const result = await createMaterial(data);

    if (result.error) {
      setError(result.error);
    } else {
      setIsOpen(false);
      onMaterialCreated();
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="font-black tracking-tight shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95">
          <Plus className="h-4 w-4 md:mr-2" strokeWidth={3} />
          <span className="hidden md:inline">Ajouter un Matériau</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[500px]">
        <DialogHeader className="bg-indigo-600 text-white border-b p-8 pb-6 shadow-lg shadow-indigo-100">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-2xl p-3 shadow-lg">
              <Package size={24} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight uppercase text-white">
                Nouveau Matériau
              </DialogTitle>
              <DialogDescription className="text-white/70 text-xs font-black tracking-widest uppercase">
                Enregistrement dans l'inventaire
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
                <Package size={14} className="text-indigo-600" /> Désignation
              </Label>
              <Input
                id="nom"
                name="nom"
                required
                placeholder="Ex: Ciment Portland CPJ45"
                className="bg-zinc-50 border-zinc-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 h-12 rounded-xl px-4 font-bold outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor="unite"
                  className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
                >
                  <Ruler size={14} className="text-indigo-600" /> Unité
                </Label>
                <Input
                  id="nom"
                  name="nom"
                  required
                  placeholder="Ex: sac, m3, kg"
                  className="bg-zinc-50 border-zinc-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 h-12 rounded-xl px-4 font-bold outline-none"
                />
                <datalist id="common-materials">
                  {COMMON_MATERIALS.map((m) => (
                    <option key={m.name} value={m.name} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2.5">
                <Label
                  htmlFor="seuil_alerte"
                  className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
                >
                  <AlertTriangle size={14} className="text-indigo-600" /> Seuil d'alerte
                </Label>
                <Input
                  id="seuil_alerte"
                  name="seuil_alerte"
                  type="number"
                  required
                  placeholder="Ex: 10"
                  className="bg-zinc-50 border-zinc-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 h-12 rounded-xl px-4 font-bold outline-none"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="stock_initial"
                className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
              >
                <TrendingUp size={14} className="text-indigo-600" /> Stock Initial
              </Label>
              <Input
                id="stock_initial"
                name="stock_initial"
                type="number"
                placeholder="0"
                className="bg-zinc-50 border-zinc-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 h-12 rounded-xl px-4 font-bold outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-red-100 animate-in fade-in slide-in-from-top-2 flex items-center gap-3 rounded-xl border p-4">
              <div className="bg-red-600 h-1.5 w-1.5 animate-pulse rounded-full" />
              <p className="text-red-600 text-xs font-black tracking-widest uppercase">{error}</p>
            </div>
          )}

          <DialogFooter className="bg-zinc-50/30 -mx-8 -mb-8 mt-4 gap-3 p-8 sm:gap-0">
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
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 h-12 flex-1 rounded-xl font-bold text-white shadow-lg shadow-indigo-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Répertorier le Matériau'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
