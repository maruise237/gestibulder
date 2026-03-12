'use client';

import React from 'react';
import { Calendar, ChevronRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/lib/context/app-context';
import { cn } from '@/lib/utils';

const PHASES = [
  {
    id: 1,
    name: 'Terrassement et Fouilles',
    status: 'termine',
    progress: 100,
    startDate: '2024-01-15',
    endDate: '2024-02-01',
    responsible: 'Ahmed Benali',
  },
  {
    id: 2,
    name: 'Fondations et Soubassement',
    status: 'en_cours',
    progress: 65,
    startDate: '2024-02-05',
    endDate: '2024-03-10',
    responsible: 'Kamel Mansouri',
  },
  {
    id: 3,
    name: 'Élévation des Murs',
    status: 'planifie',
    progress: 0,
    startDate: '2024-03-15',
    endDate: '2024-04-20',
    responsible: 'Said Brahimi',
  },
  {
    id: 4,
    name: 'Toiture et Charpente',
    status: 'planifie',
    progress: 0,
    startDate: '2024-04-25',
    endDate: '2024-05-15',
    responsible: 'Yacine Merad',
  },
];

export default function PlanningPage() {
  const { selectedProjectId } = useApp();

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl">Planning</h1>
          <p className="hidden text-size-xs font-medium text-muted-foreground sm:block">
            Suivez l'avancement temporel des phases du projet actif.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-[10px] font-semibold uppercase tracking-widest">
            Exporter GANTT
          </Button>
          <Button size="sm" className="text-[10px] font-semibold uppercase tracking-widest">
            Nouvelle Phase
          </Button>
        </div>
      </div>

      {!selectedProjectId ? (
        <Card className="border-2 border-dashed border-border bg-muted/30 py-16 text-center">
           <div className="mb-4 inline-flex rounded-xl bg-background p-4 text-muted-foreground shadow-sm">
            <Calendar size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-size-xl font-semibold tracking-tight text-zinc-950">Sélectionnez un chantier</h2>
          <p className="text-size-sm text-muted-foreground mt-1">Veuillez choisir un chantier pour voir son planning opérationnel.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
             <Card className="p-4 border-l-4 border-l-primary">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Progression Globale</p>
                <div className="mt-2 flex items-end gap-2">
                   <span className="text-2xl font-bold">42%</span>
                   <span className="text-[10px] text-muted-foreground mb-1">En avance de 2 jours</span>
                </div>
                <Progress value={42} className="mt-3" />
             </Card>
             <Card className="p-4 border-l-4 border-l-emerald-500">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Phases Terminées</p>
                <p className="mt-2 text-2xl font-bold">1 / 4</p>
                <div className="mt-2 flex items-center gap-1 text-emerald-600 text-[10px] font-medium">
                   <CheckCircle2 size={12} /> Jalons respectés
                </div>
             </Card>
             <Card className="p-4 border-l-4 border-l-amber-500">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Prochaine Échéance</p>
                <p className="mt-2 text-2xl font-bold">10 Mars</p>
                <p className="mt-2 text-muted-foreground text-[10px] font-medium">
                   Fondations et Soubassement
                </p>
             </Card>
          </div>

          {/* Timeline View */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Phases du Projet</h3>

            <div className="space-y-3">
              {PHASES.map((phase) => (
                <Card key={phase.id} className="group relative overflow-hidden transition-all hover:border-primary/50">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-6">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                      phase.status === 'termine' ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                      phase.status === 'en_cours' ? "bg-primary/5 border-primary/20 text-primary animate-pulse" :
                      "bg-muted border-transparent text-muted-foreground"
                    )}>
                      {phase.status === 'termine' ? <CheckCircle2 size={20} /> :
                       phase.status === 'en_cours' ? <Clock size={20} /> : <div className="h-2 w-2 rounded-full bg-current" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground truncate">{phase.name}</h4>
                        <span className={cn(
                          "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border",
                          phase.status === 'termine' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                          phase.status === 'en_cours' ? "bg-blue-100 text-blue-700 border-blue-200" :
                          "bg-zinc-100 text-zinc-500 border-zinc-200"
                        )}>
                          {phase.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><CheckCircle2 size={12} /> {phase.responsible}</span>
                      </div>
                    </div>

                    <div className="w-full sm:w-48 space-y-2">
                       <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-muted-foreground uppercase">Avancement</span>
                          <span className="text-primary">{phase.progress}%</span>
                       </div>
                       <Progress value={phase.progress} className="h-1.5" />
                    </div>

                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 sm:static opacity-0 group-hover:opacity-100 transition-opacity">
                       <ChevronRight size={18} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Gantt Placeholder Visual */}
          <Card className="p-8 border-2 border-dashed border-border bg-muted/20 text-center">
             <div className="max-w-md mx-auto">
                <AlertCircle className="mx-auto mb-3 text-primary/40" size={32} />
                <h4 className="text-sm font-semibold text-foreground mb-1 uppercase tracking-tight">Vue Gantt Interactive</h4>
                <p className="text-xs text-muted-foreground">La vue calendrier interactive est en cours de synchronisation avec les données terrain. Les phases ci-dessus sont extraites du devis validé.</p>
             </div>
          </Card>
        </div>
      )}
    </div>
  );
}
