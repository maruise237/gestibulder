'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApp } from '@/lib/context/app-context';
import { getBudgetData } from '@/lib/server/dashboard.actions';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  ChevronLeft,
  Wallet,
  Calendar,
  AlertCircle,
  Banknote,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function PersonnelPaymentPage() {
  const { enterprise, selectedProjectId } = useApp();

  const { data, isLoading } = useQuery({
    queryKey: ['budget-data', selectedProjectId],
    queryFn: () => getBudgetData(selectedProjectId || undefined),
  });

  const laborSummary = data?.laborSummary;
  const workers = laborSummary?.workers || [];
  const totalDebt = laborSummary?.totalDebt || 0;

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/budget">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-background shadow-sm border border-border">
              <ChevronLeft size={20} />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-size-2xl font-black tracking-tight text-foreground sm:text-size-3xl">Paiements Personnel</h1>
            <p className="text-[10px] font-bold text-muted-foreground">Suivi détaillé des salaires et impayés</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 p-4 rounded-2xl">
           <div className="bg-destructive text-destructive-foreground p-2 rounded-xl shadow-lg shadow-destructive/20">
             <Banknote size={20} />
           </div>
           <div>
             <p className="text-[10px] font-black text-destructive">Total Dettes</p>
             <p className="text-xl font-black text-destructive">{formatCurrency(totalDebt, enterprise?.devise)}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-premium border-border rounded-2xl overflow-hidden" padding="none">
             <div className="bg-muted/30 border-b border-border p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Users className="text-primary" size={20} />
                   <h2 className="text-size-lg font-black tracking-tight">Liste des Ouvriers</h2>
                </div>
                <div className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full">
                  {workers.length} Effectifs
                </div>
             </div>

             <div className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-6">
                      <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                  ))
                ) : workers.length === 0 ? (
                  <div className="py-20 text-center">
                    <Users size={48} className="mx-auto mb-4 text-muted-foreground/20" />
                    <p className="text-size-sm font-bold text-muted-foreground italic">Aucun ouvrier trouvé pour ce chantier</p>
                  </div>
                ) : (
                  workers.map((worker: any) => (
                    <div key={worker.id} className="p-6 transition-colors hover:bg-muted/30 group">
                       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                             <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20">
                               {worker.nom_complet.charAt(0)}
                             </div>
                             <div>
                                <p className="text-size-base font-black text-foreground tracking-tight">{worker.nom_complet}</p>
                                <div className="flex items-center gap-3 mt-1">
                                   <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                                      <Calendar size={12} />
                                      {worker.daysPresent} Présences
                                   </div>
                                   <div className="h-1 w-1 rounded-full bg-border" />
                                   <div className="text-[10px] font-bold text-primary">
                                      Pointage synchronisé
                                   </div>
                                </div>
                             </div>
                          </div>

                          <div className="flex items-center gap-6 sm:gap-12">
                             <div className="text-right">
                                <p className="text-[10px] font-black text-muted-foreground mb-1">Dû Total</p>
                                <p className="text-size-sm font-black text-foreground">{formatCurrency(worker.totalDue, enterprise?.devise)}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-black text-success mb-1">Déjà Payé</p>
                                <p className="text-size-sm font-black text-success">{formatCurrency(worker.totalPaid, enterprise?.devise)}</p>
                             </div>
                             <div className="text-right bg-destructive/5 p-3 rounded-xl border border-destructive min-w-[120px]">
                                <p className="text-[10px] font-black text-destructive mb-1">Reste à payer</p>
                                <p className="text-lg font-black text-destructive">{formatCurrency(worker.remaining, enterprise?.devise)}</p>
                             </div>
                             <Link href="/dashboard/ouvriers">
                                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary hover:text-primary-foreground">
                                   <ArrowRight size={20} />
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
           <Card className="bg-primary text-primary-foreground border-none p-8 rounded-2xl shadow-xl shadow-primary/20 relative overflow-hidden">
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="bg-white/20 p-2 rounded-xl">
                       <TrendingUp size={20} />
                    </div>
                    <h3 className="text-size-lg font-black tracking-tight">Analyse de Paie</h3>
                 </div>

                 <div className="space-y-6">
                    <div>
                       <p className="text-[11px] font-bold tracking-[0.2em] opacity-80 mb-2">Total Engagé</p>
                       <p className="text-3xl font-black">{formatCurrency(workers.reduce((s: number, w: any) => s + w.totalDue, 0), enterprise?.devise)}</p>
                    </div>

                    <div className="pt-6 border-t border-white/10 space-y-4">
                       <div className="flex justify-between items-center text-[11px] font-black">
                          <span>Liquidité versée</span>
                          <span>{workers.reduce((s: number, w: any) => s + w.totalDue, 0) > 0 ? ((workers.reduce((s: number, w: any) => s + w.totalPaid, 0) / workers.reduce((s: number, w: any) => s + w.totalDue, 0)) * 100).toFixed(1) : 0}%</span>
                       </div>
                       <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white transition-all duration-1000"
                            style={{ width: `${workers.reduce((s: number, w: any) => s + w.totalDue, 0) > 0 ? (workers.reduce((s: number, w: any) => s + w.totalPaid, 0) / workers.reduce((s: number, w: any) => s + w.totalDue, 0)) * 100 : 0}%` }}
                          />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="absolute -right-8 -bottom-8 opacity-10">
                 <Wallet size={160} />
              </div>
           </Card>

           <Card className="p-6 rounded-2xl border-border bg-muted/30">
              <div className="flex items-start gap-4">
                 <div className="bg-warning/10 p-2 rounded-xl text-warning mt-1">
                    <AlertCircle size={20} />
                 </div>
                 <div>
                    <h4 className="text-size-xs font-semibold text-foreground mb-1">Règle de synchronisation</h4>
                    <p className="text-size-xs text-muted-foreground leading-relaxed">
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
