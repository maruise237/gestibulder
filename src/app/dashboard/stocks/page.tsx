'use client';

import React, { useState } from 'react';
import { getMaterials, addStockMovement } from '@/lib/server/stock.actions';
import { getProjects } from '@/lib/server/project.actions';
import {
  Package,
  Search,
  PlusCircle,
  MinusCircle,
  TrendingUp,
  MoreVertical,
  Loader2,
  HardHat,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Material } from '@/types/stock';
import { CreateMaterialModal } from '@/components/dashboard/create-material-modal';
import { StockHistoryModal } from '@/components/dashboard/stock-history-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import { useApp } from '@/lib/context/app-context';

export default function StocksPage() {
  const { selectedProjectId: selectedChantier } = useApp();

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
    queryKey: ['stocks', selectedChantier],
    queryFn: async () => {
      if (!selectedChantier) return [];
      const res = await getMaterials(selectedChantier);
      return res.materials || [];
    },
    enabled: !!selectedChantier,
  });

  const movementMutation = useMutation({
    mutationFn: (data: any) => addStockMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks', selectedChantier] });
      setMovementModal({ open: false, material: null, type: 'entree' });
    },
  });

  const filteredMaterials = materials.filter((s) =>
    s.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMovement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!movementModal.material) return;

    const formData = new FormData(e.currentTarget);
    movementMutation.mutate({
      materiau_id: movementModal.material.id,
      chantier_id: selectedChantier,
      type_mouvement: movementModal.type,
      quantite: Number(formData.get('quantite')),
      cout_unitaire: formData.get('cout_unitaire') ? Number(formData.get('cout_unitaire')) : undefined,
      fournisseur: formData.get('fournisseur') as string,
      usage: formData.get('usage') as string,
      date: new Date().toISOString(),
    });
  };

  const handleMaterialCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['stocks', selectedChantier] });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl">Stocks</h1>
          <div className="relative mt-2">
            <HardHat className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" size={14} />
            <select
              className="h-9 w-full appearance-none rounded-md border border-border bg-background pr-8 pl-9 text-xs font-medium focus:border-primary outline-none sm:w-64"
              value={selectedChantier}
              onChange={(e) => setSelectedChantier(e.target.value)}
            >
              <option value="" disabled>Choisir un chantier</option>
              {projectsData?.map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" size={14} />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="group relative">
            <Search
              className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
              size={14}
            />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background pr-4 pl-9 text-xs font-medium transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 sm:w-64"
            />
          </div>
          {selectedChantier && (
            <CreateMaterialModal chantierId={selectedChantier} onMaterialCreated={handleMaterialCreated} />
          )}
        </div>
      </div>

      {!selectedChantier ? (
        <Card className="border-2 border-dashed border-border bg-muted/30 py-12 text-center">
          <div className="mb-4 inline-flex rounded-xl bg-background p-4 text-muted-foreground shadow-sm">
            <HardHat size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-size-xl font-semibold tracking-tight text-foreground">Sélectionnez un chantier</h2>
          <p className="text-size-sm text-muted-foreground mt-1">Veuillez choisir un chantier dans la liste pour voir ses stocks.</p>
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
        <Card className="border-2 border-dashed border-border bg-muted/30 py-12 text-center">
          <div className="mb-4 inline-flex rounded-xl bg-background p-4 text-muted-foreground shadow-sm">
            <Package size={32} strokeWidth={1.5} />
          </div>
          <h2 className="mb-1 text-size-xl font-semibold tracking-tight text-foreground">
            Aucun matériau
          </h2>
          <p className="mx-auto mb-6 max-w-sm text-size-sm font-medium text-muted-foreground">
            {searchQuery ? "Aucun résultat pour cette recherche." : "Ajoutez les matériaux nécessaires à ce chantier."}
          </p>
          {!searchQuery && <CreateMaterialModal chantierId={selectedChantier} onMaterialCreated={handleMaterialCreated} />}
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
                <div className="p-4 sm:p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className={cn(
                      "rounded-md p-2",
                      isOut ? "bg-destructive/10 text-destructive" : isLow ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"
                    )}>
                      <Package size={18} />
                    </div>
                    <div className="flex items-center gap-2">
                       {isOut ? (
                         <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[8px] font-semibold tracking-widest text-destructive uppercase">Rupture</span>
                       ) : isLow ? (
                         <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[8px] font-semibold tracking-widest text-amber-600 uppercase">Critique</span>
                       ) : null}
                       <button className="text-muted-foreground hover:text-foreground transition-colors">
                         <MoreVertical size={16} />
                       </button>
                    </div>
                  </div>

                  <h3 className="truncate text-size-lg font-semibold tracking-tight text-foreground group-hover:text-primary">
                    {mat.nom}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-[9px] font-semibold text-muted-foreground uppercase">
                    Seuil: {mat.seuil_alerte} {mat.unite}
                  </p>

                  <div className="my-6 flex items-center justify-between rounded-lg border border-border bg-muted/20 p-4 transition-colors group-hover:bg-muted/30">
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-size-3xl font-semibold tracking-tight",
                        isOut ? "text-destructive" : isLow ? "text-amber-600" : "text-foreground"
                      )}>
                        {stock}
                      </span>
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase">{mat.unite}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setMovementModal({ open: true, material: mat, type: 'sortie' })}
                        className="h-9 w-9 rounded-md border-border bg-background hover:bg-destructive/5 hover:text-destructive"
                        title="Consommer"
                      >
                        <MinusCircle size={18} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setMovementModal({ open: true, material: mat, type: 'entree' })}
                        className="h-9 w-9 rounded-md border-border bg-background hover:bg-emerald-500/5 hover:text-emerald-600"
                        title="Réapprovisionner"
                      >
                        <PlusCircle size={18} />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                     <span className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider">
                       Maj {new Date(mat.created_at).toLocaleDateString()}
                     </span>
                     <Button
                       variant="ghost"
                       size="sm"
                       className="h-7 px-2 text-[9px] font-semibold uppercase tracking-widest"
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
          <DialogHeader className={cn(
            "bg-muted/30 border-b p-6",
            movementModal.type === 'entree' ? "text-emerald-600" : "text-destructive"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "rounded-md p-2",
                movementModal.type === 'entree' ? "bg-emerald-500/10" : "bg-destructive/10"
              )}>
                {movementModal.type === 'entree' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
              </div>
              <div className="space-y-1">
                <DialogTitle>{movementModal.type === 'entree' ? 'Réapprovisionner' : 'Consommer'}</DialogTitle>
                <DialogDescription>Mise à jour du registre de stock</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {movementModal.material && (
            <form onSubmit={handleMovement} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
                <div className="rounded-md border border-border bg-muted/30 p-4 text-center mb-6">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase mb-1">Matériau</p>
                  <p className="text-size-lg font-semibold text-foreground">{movementModal.material.nom}</p>
                  <p className="text-[9px] font-medium text-muted-foreground uppercase">{movementModal.material.unite}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Quantité ({movementModal.material.unite})</label>
                    <input
                      name="quantite"
                      type="number"
                      required
                      step="0.01"
                      placeholder="0.00"
                      autoFocus
                      className="h-12 w-full rounded-md border border-border bg-background text-center text-size-2xl font-semibold outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </div>

                  {movementModal.type === 'entree' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Prix Unit.</label>
                        <input
                          name="cout_unitaire"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="h-9 w-full rounded-md border border-border bg-background px-3 text-xs font-medium outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Fournisseur</label>
                        <input
                          name="fournisseur"
                          placeholder="Nom..."
                          className="h-9 w-full rounded-md border border-border bg-background px-3 text-xs font-medium outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Destination</label>
                      <input
                        name="usage"
                        placeholder="Ex: Dalle 2ème étage..."
                        className="h-9 w-full rounded-md border border-border bg-background px-3 text-xs font-medium outline-none focus:border-primary"
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
                  className="flex-1 text-[10px] font-semibold uppercase tracking-widest"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={movementMutation.isPending}
                  className={cn(
                    "flex-1 text-[10px] font-semibold uppercase tracking-widest",
                    movementModal.type === 'entree' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-destructive hover:bg-destructive/90"
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
