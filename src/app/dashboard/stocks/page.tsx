'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Package,
  Loader2,
  Plus,
  AlertTriangle,
  Archive,
  HardHat,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PlusCircle,
  MinusCircle,
  X,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
} from 'lucide-react';
import { getMaterials, addStockMovement } from '@/lib/server/stock.actions';
import { getProjects } from '@/lib/server/project.actions';
import { Material, NewStockMovement } from '@/types/stock';
import { Project } from '@/types/project';
import { CreateMaterialModal } from '@/components/dashboard/create-material-modal';
import { StockHistoryModal } from '@/components/dashboard/stock-history-modal';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/lib/context/app-context';

export default function StocksPage() {
  const { enterprise } = useApp();
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChantier, setSelectedChantier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [movementModal, setMovementModal] = useState<{
    open: boolean;
    material?: Material;
    type?: 'entree' | 'sortie';
  }>({ open: false });
  const [historyModal, setHistoryModal] = useState<{ open: boolean; material?: Material }>({
    open: false,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const p = await getProjects();
    if (p.projects) setProjects(p.projects);

    if (selectedChantier) {
      const m = await getMaterials(selectedChantier);
      if (m.materials) setMaterials(m.materials);
    }
    setIsLoading(false);
  }, [selectedChantier]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMovement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!movementModal.material || !movementModal.type) return;

    setIsSubmitting(movementModal.material.id);
    const formData = new FormData(e.currentTarget);

    const data: NewStockMovement = {
      chantier_id: selectedChantier,
      materiau_id: movementModal.material.id,
      type_mouvement: movementModal.type,
      quantite: Number(formData.get('quantite')),
      cout_unitaire: Number(formData.get('cout_unitaire')) || undefined,
      date: new Date().toISOString().split('T')[0],
      fournisseur: (formData.get('fournisseur') as string) || undefined,
      usage: (formData.get('usage') as string) || undefined,
    };

    const result = await addStockMovement(data);

    if (result.error) {
      alert(result.error);
    } else {
      setMovementModal({ open: false });
      fetchData();
    }
    setIsSubmitting(null);
  };

  return (
    <div className="animate-in fade-in space-y-10 pb-20 duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-black tracking-tight text-zinc-950">Stocks & Matériaux</h1>
          <p className="font-bold tracking-tight text-zinc-500">
            Suivi des consommations et gestion des approvisionnements.
          </p>
        </div>
        {selectedChantier && (
          <CreateMaterialModal chantierId={selectedChantier} onMaterialCreated={fetchData} />
        )}
      </div>

      {/* Project Selector */}
      <Card
        className="shadow-elevated border-none bg-indigo-600 p-8 text-white shadow-indigo-100"
        padding="none"
      >
        <div className="px-8">
          <label className="mb-3 block text-[10px] font-black tracking-[0.2em] text-indigo-200 uppercase">
            Localisation du chantier
          </label>
          <div className="group relative">
            <HardHat
              className="absolute top-1/2 left-0 -translate-y-1/2 text-indigo-300 transition-colors group-hover:text-white"
              size={24}
            />
            <select
              className="w-full cursor-pointer appearance-none bg-transparent pl-10 text-3xl font-black tracking-tight text-white outline-none"
              value={selectedChantier}
              onChange={(e) => setSelectedChantier(e.target.value)}
            >
              <option value="" className="font-bold text-zinc-900">
                -- Sélectionner un projet --
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="font-bold text-zinc-900">
                  {p.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 text-zinc-400">
          <Loader2 className="mb-4 animate-spin" size={40} />
          <p className="font-black tracking-tight">Mise à jour de l'inventaire...</p>
        </div>
      ) : !selectedChantier ? (
        <Card className="border-2 border-dashed border-zinc-100 bg-zinc-50/30 py-24 text-center">
          <Archive size={48} className="mx-auto mb-6 opacity-10" />
          <p className="text-lg font-black text-zinc-400 italic">
            Veuillez sélectionner un chantier pour voir l'état des stocks.
          </p>
        </Card>
      ) : materials.length === 0 ? (
        <Card className="border-2 border-dashed border-zinc-100 bg-zinc-50/30 py-24 text-center">
          <div className="mb-6 inline-flex rounded-3xl bg-white p-6 text-zinc-300 shadow-sm">
            <Package size={48} strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-2xl font-black tracking-tight text-zinc-950">
            Aucun matériau répertorié
          </h2>
          <p className="mx-auto mb-10 max-w-sm font-bold tracking-tight text-zinc-500">
            Commencez par ajouter les matériaux (Ciment, Sable, Acier) utilisés sur ce chantier.
          </p>
          <CreateMaterialModal chantierId={selectedChantier} onMaterialCreated={fetchData} />
        </Card>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((mat) => {
            const stock = mat.stock_actuel || 0;
            const isLow = stock <= mat.seuil_alerte;
            const isOut = stock <= 0;

            return (
              <Card
                key={mat.id}
                hoverable
                className={cn(
                  'group flex flex-col border-l-8 transition-all duration-300',
                  isOut
                    ? 'border-l-red-500 shadow-red-50/50'
                    : isLow
                      ? 'border-l-amber-500 shadow-amber-50/50'
                      : 'hover:border-l-indigo-600'
                )}
                padding="none"
              >
                <div className="p-8">
                  <div className="mb-8 flex items-start justify-between">
                    <div
                      className={cn(
                        'rounded-2xl p-3 shadow-sm transition-all duration-300 group-hover:scale-110',
                        isOut
                          ? 'border border-red-100 bg-red-50 text-red-600'
                          : isLow
                            ? 'border border-amber-100 bg-amber-50 text-amber-600'
                            : 'border border-zinc-100 bg-zinc-50 text-zinc-900 group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                      )}
                    >
                      <Archive size={24} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {isOut ? (
                        <span className="rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-red-200">
                          Rupture de Stock
                        </span>
                      ) : (
                        isLow && (
                          <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-amber-200">
                            Stock Critique
                          </span>
                        )
                      )}
                      <button className="rounded-xl p-2 text-zinc-300 transition-all hover:bg-zinc-50 hover:text-zinc-950">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>

                  <h3 className="mb-1 truncate text-2xl leading-tight font-black tracking-tight text-zinc-950 transition-colors group-hover:text-indigo-600">
                    {mat.nom}
                  </h3>
                  <p className="mb-8 flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
                    <TrendingUp size={12} className="text-indigo-500/50" /> Seuil d'alerte :{' '}
                    {mat.seuil_alerte} {mat.unite}
                  </p>

                  <div className="mb-8 flex items-center justify-between rounded-3xl border border-zinc-100 bg-zinc-50/80 p-6 transition-all group-hover:bg-white group-hover:shadow-sm">
                    <div className="flex flex-col">
                      <span
                        className={cn(
                          'text-5xl leading-none font-black tracking-tighter',
                          isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-zinc-950'
                        )}
                      >
                        {stock}
                      </span>
                      <span className="mt-2 text-[11px] font-black tracking-widest text-zinc-400 uppercase">
                        {mat.unite}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setMovementModal({ open: true, material: mat, type: 'sortie' })
                        }
                        className="h-12 w-12 rounded-xl border-zinc-200 bg-white shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <MinusCircle size={22} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setMovementModal({ open: true, material: mat, type: 'entree' })
                        }
                        className="h-12 w-12 rounded-xl border-zinc-200 bg-white shadow-sm hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                      >
                        <PlusCircle size={22} />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-6">
                    <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                      Mis à jour le {new Date(mat.created_at).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-xl text-[10px] font-black tracking-widest text-indigo-600 uppercase hover:bg-indigo-50"
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
          onClose={() => setHistoryModal({ open: false })}
        />
      )}

      {/* Modal de mouvement (Entrée/Sortie) */}
      {movementModal.open && movementModal.material && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm duration-300">
          <Card
            className="shadow-elevated animate-in zoom-in w-full max-w-md overflow-hidden border-none p-0 duration-300"
            padding="none"
          >
            <div
              className={cn(
                'flex items-center justify-between border-b border-white/10 p-10',
                movementModal.type === 'entree'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
                  : 'bg-red-600 text-white shadow-lg shadow-red-100'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-2">
                  {movementModal.type === 'entree' ? (
                    <ArrowUpRight size={20} />
                  ) : (
                    <ArrowDownRight size={20} />
                  )}
                </div>
                <h2 className="text-xl font-black tracking-tight uppercase">
                  {movementModal.type === 'entree' ? 'Entrée Stock' : 'Consommation'}
                </h2>
              </div>
              <button
                onClick={() => setMovementModal({ open: false })}
                className="rounded-xl p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleMovement} className="space-y-8 p-10">
              <div className="rounded-3xl border border-zinc-100 bg-zinc-50/50 p-6 text-center">
                <p className="mb-2 text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
                  Matériau identifié
                </p>
                <p className="text-3xl font-black tracking-tight text-zinc-950">
                  {movementModal.material.nom}
                </p>
                <p className="mt-1 text-[11px] font-black tracking-widest text-zinc-400 uppercase">
                  Unité: {movementModal.material.unite}
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                    Quantité ({movementModal.material.unite})
                  </label>
                  <input
                    name="quantite"
                    type="number"
                    required
                    step="0.01"
                    placeholder="0.00"
                    autoFocus
                    className="h-24 w-full rounded-3xl border border-zinc-200 bg-zinc-50 text-center text-5xl font-black transition-all outline-none placeholder:text-zinc-200 focus:border-indigo-600 focus:ring-8 focus:ring-indigo-600/5"
                  />
                </div>

                {movementModal.type === 'entree' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                        Coût Unitaire
                      </label>
                      <input
                        name="cout_unitaire"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="h-14 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 font-black transition-all outline-none placeholder:text-zinc-300 focus:border-indigo-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                        Fournisseur
                      </label>
                      <input
                        name="fournisseur"
                        placeholder="Nom..."
                        className="h-14 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 font-black transition-all outline-none placeholder:text-zinc-300 focus:border-indigo-600"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                      Usage / Destination
                    </label>
                    <input
                      name="usage"
                      placeholder="Ex: Dalle 2ème étage..."
                      className="h-14 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 font-black transition-all outline-none placeholder:text-zinc-300 focus:border-indigo-600"
                    />
                  </div>
                )}
              </div>

              <Button
                type="submit"
                isLoading={!!isSubmitting}
                className={cn(
                  'mt-4 h-16 w-full border-none text-xl font-black tracking-widest uppercase shadow-xl transition-all active:scale-95',
                  movementModal.type === 'entree'
                    ? 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700'
                    : 'bg-red-600 shadow-red-200 hover:bg-red-700'
                )}
              >
                Valider la transaction
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
