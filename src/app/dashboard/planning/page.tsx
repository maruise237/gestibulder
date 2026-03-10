import React from 'react';
import { Calendar, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PlanningPage() {
  return (
    <div className="animate-in fade-in space-y-10 pb-20 duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-black tracking-tight text-zinc-950">Planning & Délais</h1>
          <p className="font-bold tracking-tight text-zinc-500 italic">
            Planifiez vos ressources et suivez l'avancement temporel des phases.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-zinc-200 text-[11px] font-black tracking-widest uppercase"
          >
            Vue Semaine
          </Button>
          <Button className="border-none bg-indigo-600 text-[11px] font-black tracking-widest uppercase shadow-lg shadow-indigo-100">
            Vue Mois
          </Button>
        </div>
      </div>

      <Card
        className="border-2 border-dashed border-zinc-100 bg-zinc-50/30 py-32 text-center shadow-none"
        padding="none"
      >
        <div className="mb-8 inline-flex rounded-3xl border border-zinc-100 bg-white p-8 text-indigo-600 shadow-sm">
          <Layers size={48} strokeWidth={1.5} />
        </div>
        <h2 className="mb-4 text-3xl font-black tracking-tight text-zinc-950 uppercase">
          Module en cours de design
        </h2>
        <p className="mx-auto mb-10 max-w-md text-lg font-bold tracking-tight text-zinc-500 italic">
          Ce module intégrera un diagramme de Gantt intelligent pour le suivi des phases critiques
          et l'ordonnancement automatique des ressources.
        </p>

        <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-6 border-t border-zinc-100 pt-10">
          <div className="flex items-center gap-3 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
            <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-100" />{' '}
            Phase Terminée
          </div>
          <div className="flex items-center gap-3 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
            <div className="h-3 w-3 rounded-full bg-indigo-600 shadow-lg shadow-indigo-100" /> En
            Cours
          </div>
          <div className="flex items-center gap-3 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
            <div className="h-3 w-3 rounded-full bg-amber-500 shadow-lg shadow-amber-100" /> Retard
            Critique
          </div>
          <div className="flex items-center gap-3 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
            <div className="h-3 w-3 rounded-full bg-zinc-200 shadow-lg shadow-zinc-50" /> Planifié
          </div>
        </div>
      </Card>
    </div>
  );
}
