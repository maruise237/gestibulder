'use client';

import React, { useState, useEffect } from 'react';
import { deployEquipment } from '@/lib/server/equipment.actions';
import { getProjects } from '@/lib/server/project.actions';
import {
  Loader2,
  Plus,
  X,
  Truck,
  Calendar,
  HardHat,
  Settings2,
  ArrowRightLeft,
} from 'lucide-react';
import { Equipment } from '@/types/equipment';
import { Project } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
      chantier_id: formData.get('chantier_id') as string,
      date_debut: formData.get('date_debut') as string,
      date_fin: formData.get('date_fin') as string,
    };

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

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="group/btn h-10 rounded-xl border-zinc-200 px-4 hover:border-indigo-500"
        onClick={() => setIsOpen(true)}
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
    );
  }

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm duration-300">
      <Card
        className="shadow-elevated w-full max-w-lg overflow-hidden border-none p-0"
        padding="none"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/30 p-6 sm:p-10">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-600 p-2 text-white shadow-lg shadow-indigo-200">
              <ArrowRightLeft size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl leading-none font-black tracking-tight text-zinc-950">
                Déploiement Matériel
              </h2>
              <p className="mt-1 text-[10px] font-bold tracking-widest text-indigo-600/60 text-zinc-400 uppercase">
                Affectation sur chantier
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-xl p-2 text-zinc-400 transition-all hover:bg-white hover:text-zinc-950"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-10">
          <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-6 text-center">
            <p className="mb-2 text-[10px] font-black tracking-[0.2em] text-indigo-400 uppercase">
              Équipement identifié
            </p>
            <p className="text-3xl font-black tracking-tight text-zinc-950">{equipment.nom}</p>
            <p className="mt-1 text-[11px] font-black tracking-widest text-zinc-400 uppercase">
              Catégorie: {equipment.categorie}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                <HardHat size={12} className="text-indigo-500" /> Chantier de destination
              </label>
              <div className="group relative">
                <select
                  name="chantier_id"
                  required
                  className="h-14 w-full cursor-pointer appearance-none rounded-2xl border border-zinc-200 bg-zinc-50 px-5 font-black text-zinc-950 transition-all outline-none focus:border-indigo-600 focus:ring-8 focus:ring-indigo-600/5"
                >
                  <option value="">-- Sélectionner un projet --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 text-zinc-400">
                  <Plus size={16} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                  <Calendar size={12} className="text-indigo-500" /> Date de début
                </label>
                <input
                  name="date_debut"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="h-14 w-full cursor-pointer rounded-2xl border border-zinc-200 bg-zinc-50 px-5 font-black text-zinc-950 transition-all outline-none focus:border-indigo-600 focus:ring-8 focus:ring-indigo-600/5"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                  <Calendar size={12} className="text-indigo-500" /> Fin prévue
                </label>
                <input
                  name="date_fin"
                  type="date"
                  required
                  className="h-14 w-full cursor-pointer rounded-2xl border border-zinc-200 bg-zinc-50 px-5 font-black text-zinc-950 transition-all outline-none focus:border-indigo-600 focus:ring-8 focus:ring-indigo-600/5"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              <p className="text-xs font-black tracking-widest text-red-600 uppercase">{error}</p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOpen(false)}
              className="h-14 flex-1 font-black"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              className="h-14 flex-1 text-base font-black shadow-xl shadow-indigo-100"
            >
              Confirmer
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
