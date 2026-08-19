'use client';

import React, { useState } from 'react';
import { getMaterials, addStockMovement, deleteMaterial } from '@/lib/server/stock.actions';
import { getProjects } from '@/lib/server/project.actions';
import { useApp } from '@/lib/context/app-context';
import {
  Package, Plus,
  Search,
  PlusCircle,
  MinusCircle,
  MoreVertical,
  Loader2,
  HardHat,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Material } from '@/types/stock';
import { CreateMaterialModal } from '@/components/dashboard/create-material-modal';
import { EmptyState } from '@/components/dashboard/empty-state';
import { StockHistoryModal } from '@/components/dashboard/stock-history-modal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function StocksPage() {
  const { selectedProjectId, enterprise } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [movementModal, setMovementModal] = useState<{
    open: boolean;
    material: Material | null;
    type: 'entree' | 'sortie';
  }>({ open: false, material: null, type: 'entree' });
  const [historyModal, setHistoryModal] = useState<{ open: boolean; material: Material | null }>({
    open: false,
    material: null,
  });

  const queryClient = useQueryClient();

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['stocks', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const res = await getMaterials(selectedProjectId);
      return res.materials || [];
    },
    enabled: !!selectedProjectId,
  });

  const movementMutation = useMutation({
    mutationFn: (data: any) => addStockMovement(data),
    onSuccess: (result) => {
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['stocks', selectedProjectId] });
      setMovementModal({ open: false, material: null, type: 'entree' });
    },
    onError: () => {
      toast.error("Une erreur est survenue lors de l'enregistrement du mouvement.");
    },
  });

  const filteredMaterials = materials.filter((s) =>
    s.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMovement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!movementModal.material || !selectedProjectId) return;

    const formData = new FormData(e.currentTarget);
    movementMutation.mutate({
      materiau_id: movementModal.material.id,
      chantier_id: selectedProjectId,
      type_mouvement: movementModal.type,
      quantite: Number(formData.get('quantite')),
      cout_unitaire: formData.get('cout_unitaire') ? Number(formData.get('cout_unitaire')) : undefined,
      fournisseur: formData.get('fournisseur') as string,
      usage: formData.get('usage') as string,
      date_operation: new Date().toISOString(),
    });
  };

  const handleMaterialCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['stocks', selectedProjectId] });
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Supprimer ce matériau du catalogue ?')) return;
    const result = await deleteMaterial(id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      queryClient.invalidateQueries({ queryKey: ['stocks', selectedProjectId] });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-size-2xl font-medium text-foreground sm:text-size-3xl">Stocks</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="group relative">
            <Search
              className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
              size={14}
            />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full pr-4 pl-9 text-xs font-medium focus:ring-4 focus:ring-primary/10 sm:w-64"
            />
          </div>
          {selectedProjectId && (
            <CreateMaterialModal chantierId={selectedProjectId} onMaterialCreated={handleMaterialCreated} />
          )}
        </div>
      </div>

      {!selectedProjectId ? (
        <Card className="border-border">
          <EmptyState
            icon={HardHat}
            title="Sélectionnez un chantier"
            description="Utilisez le sélecteur en haut pour voir les stocks d'un chantier."
          />
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-12 w-full rounded-md mb-4" />
              <Skeleton className="h-9 w-full rounded-md" />
            </Card>
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <Card className="border-border">
          <EmptyState
            icon={Package}
            title="Aucun matériau"
            description={searchQuery ? "Aucun résultat pour cette recherche." : "Ajoutez les matériaux nécessaires à ce chantier."}
            action={!searchQuery ? <CreateMaterialModal chantierId={selectedProjectId} onMaterialCreated={handleMaterialCreated} /> : undefined}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((mat) => {
            const stock = mat.stock_actuel || 0;
            const isLow = stock <= mat.seuil_alerte && stock > 0;
            const isOut = stock <= 0;

            return (
              <Card
                key={mat.id}
                className="group flex flex-col overflow-hidden border-border p-0"
                padding="none"
              >
                <div className="p-6">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="truncate text-size-lg font-medium text-foreground">
                      {mat.nom}
                    </h3>
                    <div className="flex shrink-0 items-center gap-1">
                       {isOut ? (
                         <span className="text-xs font-medium text-destructive">Rupture</span>
                       ) : isLow ? (
                         <span className="text-xs font-medium text-warning">Critique</span>
                       ) : null}
                       <Popover>
                         <PopoverTrigger asChild>
                           <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
                             <MoreVertical size={16} />
                           </Button>
                         </PopoverTrigger>
                         <PopoverContent align="end" className="w-44 p-1">
                           <Button
                             variant="ghost"
                             className="w-full justify-start gap-2 text-xs font-medium text-destructive hover:bg-destructive/5 hover:text-destructive"
                             onClick={() => handleDeleteMaterial(mat.id)}
                           >
                             <Trash2 size={14} /> Supprimer
                           </Button>
                         </PopoverContent>
                       </Popover>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Seuil d'alerte : {mat.seuil_alerte} {mat.unite}
                  </p>

                  <div className="my-6 flex items-center justify-between border-t border-b border-border py-4">
                    <div>
                      <span className={cn(
                        "font-display text-size-3xl font-medium",
                        isOut ? "text-destructive" : isLow ? "text-warning" : "text-foreground"
                      )}>
                        {stock}
                      </span>
                      <span className="ml-1.5 text-xs text-muted-foreground">{mat.unite}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setMovementModal({ open: true, material: mat, type: 'sortie' })}
                        className="h-9 w-9 border-border hover:bg-destructive/5 hover:text-destructive"
                        title="Consommer"
                      >
                        <MinusCircle size={18} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setMovementModal({ open: true, material: mat, type: 'entree' })}
                        className="h-9 w-9 border-border hover:bg-success/5 hover:text-success"
                        title="Réapprovisionner"
                      >
                        <PlusCircle size={18} />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                     <span className="font-tabular text-xs text-muted-foreground">
                       Mis à jour le {new Date(mat.created_at).toLocaleDateString()}
                     </span>
                     <Button
                       variant="ghost"
                       size="sm"
                       className="h-7 px-2 text-xs"
                       onClick={() => setHistoryModal({ open: true, material: mat })}
                     >
                       Historique
                     </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Historique */}
      {historyModal.open && historyModal.material && (
        <StockHistoryModal
          material={historyModal.material}
          onClose={() => setHistoryModal({ open: false, material: null })}
        />
      )}

      {/* Modal de mouvement */}
      <Dialog
        open={movementModal.open}
        onOpenChange={(open) => !open && setMovementModal({ ...movementModal, open: false })}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader className="border-b border-border p-6">
            <DialogTitle className={cn(
              "font-display text-xl font-medium",
              movementModal.type === 'entree' ? "text-success" : "text-destructive"
            )}>
              {movementModal.type === 'entree' ? 'Réapprovisionner' : 'Consommer'}
            </DialogTitle>
            <DialogDescription>Mise à jour du registre de stock</DialogDescription>
          </DialogHeader>

          {movementModal.material && (
            <form onSubmit={handleMovement} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
                <div className="border border-border p-4 text-center mb-6">
                  <p className="text-xs text-muted-foreground mb-1">Matériau</p>
                  <p className="text-size-lg font-medium text-foreground">{movementModal.material.nom}</p>
                  <p className="text-xs text-muted-foreground">{movementModal.material.unite}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Quantité ({movementModal.material.unite})</Label>
                    <Input
                      name="quantite"
                      type="number"
                      required
                      step="0.01"
                      placeholder="0.00"
                      autoFocus
                      className="font-tabular h-12 w-full text-center text-size-2xl font-medium focus:ring-4 focus:ring-primary/10"
                    />
                  </div>

                  {movementModal.type === 'entree' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Prix unitaire ({enterprise?.devise || 'DZD'})</Label>
                        <Input
                          name="cout_unitaire"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="h-9 w-full px-3 text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Fournisseur</Label>
                        <Input
                          name="fournisseur"
                          placeholder="Nom..."
                          className="h-9 w-full px-3 text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Destination</Label>
                      <Input
                        name="usage"
                        placeholder="Ex: Dalle 2ème étage..."
                        className="h-9 w-full px-3 text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMovementModal({ ...movementModal, open: false })}
                  className="flex-1 text-xs"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={movementMutation.isPending}
                  className={cn(
                    "flex-1 text-xs",
                    movementModal.type === 'entree'
                      ? "bg-success text-success-foreground hover:bg-success/90"
                      : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  )}
                >
                  {movementMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmer'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
