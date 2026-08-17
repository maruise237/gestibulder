'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApp } from '@/lib/context/app-context';
import { getBudgetData } from '@/lib/server/dashboard.actions';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/dashboard/empty-state';
import {
  Users,
  ChevronLeft,
  Calendar,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function PersonnelPaymentPage() {
  const { enterprise, selectedProjectId } = useApp();

  const { data, isLoading } = useQuery({
    queryKey: ['budget-data', selectedProjectId],
    queryFn: () => getBudgetData(selectedProjectId || undefined),
  });

  const laborSummary = data?.laborSummary;
  const workers = laborSummary?.workers || [];
  const totalDebt = laborSummary?.totalDebt || 0;
  const totalDue = workers.reduce((s: number, w: any) => s + w.totalDue, 0);
  const totalPaid = workers.reduce((s: number, w: any) => s + w.totalPaid, 0);
  const paidRatio = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/budget">
            <Button variant="ghost" size="icon" className="h-9 w-9 border border-border">
              <ChevronLeft size={18} />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-size-2xl font-medium text-foreground sm:text-size-3xl">Paiements personnel</h1>
            <p className="text-xs text-muted-foreground">Suivi détaillé des salaires et impayés</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total dettes</p>
          <p className="font-tabular text-size-xl font-medium text-destructive">{formatCurrency(totalDebt, enterprise?.devise)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-border" padding="none">
             <div className="border-b border-border p-4 sm:p-6 flex items-center justify-between">
                <h2 className="font-display text-lg font-medium text-foreground">Liste des ouvriers</h2>
                <span className="text-xs text-muted-foreground">
                  {workers.length} effectif{workers.length > 1 ? 's' : ''}
                </span>
             </div>

             <div className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-6">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))
                ) : workers.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="Aucun ouvrier trouvé"
                    description="Aucun ouvrier trouvé pour ce chantier."
                  />
                ) : (
                  workers.map((worker: any) => (
                    <div key={worker.id} className="p-4 transition-colors hover:bg-muted/30 sm:p-6">
                       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                             <p className="text-size-sm font-medium text-foreground">{worker.nom_complet}</p>
                             <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-tabular flex items-center gap-1">
                                   <Calendar size={11} />
                                   {worker.daysPresent} présences
                                </span>
                             </div>
                          </div>

                          <div className="flex items-center gap-6 sm:gap-10">
                             <div className="text-right">
                                <p className="text-xs text-muted-foreground mb-0.5">Dû total</p>
                                <p className="font-tabular text-size-sm font-medium text-foreground">{formatCurrency(worker.totalDue, enterprise?.devise)}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-xs text-success mb-0.5">Déjà payé</p>
                                <p className="font-tabular text-size-sm font-medium text-success">{formatCurrency(worker.totalPaid, enterprise?.devise)}</p>
                             </div>
                             <div className="text-right min-w-[110px]">
                                <p className="text-xs text-destructive mb-0.5">Reste à payer</p>
                                <p className="font-tabular text-size-base font-medium text-destructive">{formatCurrency(worker.remaining, enterprise?.devise)}</p>
                             </div>
                             <Link href="/dashboard/ouvriers">
                                <Button variant="ghost" size="icon" className="hover:bg-primary hover:text-primary-foreground">
                                   <ArrowRight size={18} />
                                </Button>
                             </Link>
                          </div>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
           <Card className="border-border p-6">
              <h3 className="font-display text-lg font-medium text-foreground mb-6">Analyse de paie</h3>

              <div className="space-y-6">
                 <div>
                    <p className="text-xs text-muted-foreground mb-1">Total engagé</p>
                    <p className="font-tabular text-size-2xl font-medium text-foreground">{formatCurrency(totalDue, enterprise?.devise)}</p>
                 </div>

                 <div className="pt-4 border-t border-border space-y-2">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                       <span>Liquidité versée</span>
                       <span className="font-tabular">{paidRatio.toFixed(1)}%</span>
                    </div>
                    <div className="h-1 w-full bg-muted overflow-hidden">
                       <div
                        className="h-full bg-primary transition-all duration-1000"
                        style={{ width: `${paidRatio}%` }}
                       />
                    </div>
                 </div>
              </div>
           </Card>

           <Card className="p-6 rounded-2xl border-border bg-muted/30">
              <div className="flex items-start gap-4">
                 <AlertCircle size={18} className="text-warning mt-0.5 shrink-0" />
                 <div>
                    <h4 className="text-size-sm font-medium text-foreground mb-1">Règle de synchronisation</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                       Les montants dus sont calculés automatiquement selon le pointage "Présent". Les jours d'absence ou non pointés ne génèrent aucun coût.
                    </p>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
