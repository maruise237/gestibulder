'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PlanningPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Planning & Délais</h1>
          <p className="text-sm text-muted-foreground">
            Planifiez vos ressources et suivez l'avancement des phases.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Vue Semaine</Button>
          <Button size="sm">Vue Mois</Button>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 rounded-full bg-muted p-6 text-primary">
            <Layers size={40} />
          </div>
          <h2 className="text-xl font-semibold mb-2">Module en cours de design</h2>
          <p className="max-w-md text-sm text-muted-foreground mb-8">
            Ce module intégrera un diagramme de Gantt pour le suivi des phases critiques
            et l'ordonnancement des ressources.
          </p>

          <div className="flex flex-wrap justify-center gap-6 pt-6 border-t w-full max-w-lg">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Phase Terminée
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-primary" />
              En Cours
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              Retard Critique
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-muted" />
              Planifié
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
