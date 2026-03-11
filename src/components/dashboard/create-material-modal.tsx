'use client';

import React, { useState } from 'react';
import { createMaterial } from '@/lib/server/stock.actions';
import { Loader2, Plus, Package } from 'lucide-react';
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
  { name: 'Ciment Portland', unit: 'Sacs' },
  { name: 'Sable Lavé', unit: 'm³' },
  { name: 'Gravier 15/25', unit: 'm³' },
  { name: 'Rond à Béton 12mm', unit: 'Barres' },
  { name: 'Briques 8 Trous', unit: 'Unités' },
  { name: 'Plâtre de Construction', unit: 'Sacs' },
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
      seuil_alerte: Number(formData.get('seuil_alerte')),
      chantier_id: chantierId || '',
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Matériau
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader className="bg-muted/30 border-b p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground rounded-md p-2">
              <Package size={20} />
            </div>
            <div className="space-y-1">
              <DialogTitle>Nouveau Matériau</DialogTitle>
              <DialogDescription>Gestion du catalogue de stock</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Désignation du Matériau</Label>
                <Input
                  id="unite"
                  name="unite"
                  required
                  list="common-materials"
                  placeholder="Ex: Ciment Portland"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unite">Unité Standard</Label>
                  <Input
                    id="unite"
                    name="unite"
                    required
                    placeholder="Sacs, m³, kg..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seuil_alerte">Seuil d'Alerte</Label>
                  <Input
                    id="seuil_alerte"
                    name="seuil_alerte"
                    type="number"
                    defaultValue="5"
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
