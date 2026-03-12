'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PlanningPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl">Planning</h1>
          <p className="hidden text-size-xs font-medium text-muted-foreground sm:block">
            Suivez l'avancement temporel des phases.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-[10px] font-semibold uppercase tracking-widest">
            Semaine
          </Button>
          <Button size="sm" className="text-[10px] font-semibold uppercase tracking-widest">
            Mois
          </Button>
        </div>
      </div>

      <Card
        className="border-2 border-dashed border-border bg-muted/30 py-16 text-center sm:py-24"
        padding="none"
      >
        <div className="mb-6 inline-flex rounded-xl bg-background p-6 text-primary shadow-sm">
          <Layers size={40} strokeWidth={1.5} />
        </div>
        <h2 className="mb-2 text-size-xl font-semibold tracking-tight text-foreground uppercase">
          En développement
        </h2>
        <p className="mx-auto mb-8 max-w-md text-size-sm font-medium text-muted-foreground italic">
          Ce module intégrera un diagramme de Gantt pour le suivi des phases critiques.
        </p>

        <div className="mx-auto flex max-w-xl flex-wrap justify-center gap-4 border-t border-border pt-8 sm:gap-6">
          <div className="flex items-center gap-2 text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            Terminé
          </div>
          <div className="flex items-center gap-2 text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
            <div className="h-2 w-2 rounded-full bg-primary" />
            En Cours
          </div>
          <div className="flex items-center gap-2 text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            Retard
          </div>
          <div className="flex items-center gap-2 text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
            <div className="h-2 w-2 rounded-full bg-muted" />
            Planifié
          </div>
        </div>
      </Card>
    </div>
  );
}
