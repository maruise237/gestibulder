'use client';

import React from 'react';
import {
  HardHat,
  Users,
  TrendingUp,
  Package,
  AlertCircle,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Plus,
} from 'lucide-react';
import { getDashboardData } from '@/lib/server/dashboard.actions';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/lib/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { ExportModal } from '@/components/dashboard/export-modal';
import { CreateProjectModal } from '@/components/dashboard/create-project-modal';
import { OnboardingWizard } from '@/components/dashboard/onboarding-wizard';

export default function DashboardPage() {
  const { enterprise } = useApp();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      const data = await getDashboardData();
      if (data.error) throw new Error(data.error);

      const stats = {
        projectsCount: data.projects?.length || 0,
        workersCount: data.workersCount || 0,
        activeWorkers: data.workers?.filter((w: any) => w.actif).length || 0,
        totalExpenses:
          data.expenses?.reduce((sum: number, item: any) => sum + item.montant, 0) || 0,
        activeProjects:
          data.projects?.filter((proj: any) => proj.statut === 'en_cours').length || 0,
        stockAlerts: data.alerts?.length || 0,
      };

      const soon =
        data.projects
          ?.filter(
            (proj: any) =>
              proj.date_fin_prevue && new Date(proj.date_fin_prevue) > new Date()
          )
          .sort(
            (a: any, b: any) =>
              new Date(a.date_fin_prevue).getTime() - new Date(b.date_fin_prevue).getTime()
          ) || [];

      return {
        stats,
        recentMovements: data.movements || [],
        recentProjects: soon,
      };
    },
  });

  const stats = data?.stats || {
    projectsCount: 0,
    workersCount: 0,
    activeWorkers: 0,
    totalExpenses: 0,
    activeProjects: 0,
    stockAlerts: 0,
  };
  const recentMovements = data?.recentMovements || [];
  const recentProjects = data?.recentProjects || [];

  return (
    <div className="space-y-fluid-md">
      {!isLoading && stats.projectsCount === 0 ? (
        <OnboardingWizard onComplete={() => refetch()} />
      ) : (
        <>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="space-y-1">
              <h1 className="text-size-2xl font-black tracking-tight text-foreground sm:text-size-3xl uppercase">Tableau de bord</h1>
              <p className="text-size-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {isLoading ? (
                  <Skeleton className="h-3 w-48" />
                ) : (
                  `Vue d'ensemble • ${stats.projectsCount} Chantiers`
                )}
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <ExportModal enterprise={enterprise} />
              <CreateProjectModal onProjectCreated={() => refetch()} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-fluid-md">
            {/* Quick Stats */}
            {[
              {
                label: 'Chantiers',
                value: stats.activeProjects,
                icon: HardHat,
                color: 'indigo',
                sub: 'En cours',
              },
              {
                label: 'Dépenses',
                value: formatCurrency(stats.totalExpenses, enterprise?.devise),
                icon: TrendingDown,
                color: 'rose',
                sub: 'Total cumulé',
              },
              {
                label: 'Effectifs',
                value: stats.activeWorkers,
                icon: Users,
                color: 'emerald',
                sub: 'Présents ce jour',
              },
              {
                label: 'Stocks',
                value: stats.stockAlerts,
                icon: AlertCircle,
                color: stats.stockAlerts > 0 ? 'amber' : 'emerald',
                sub: 'Alertes critiques',
              },
            ].map((stat, i) => (
              <Card
                key={i}
                className={cn(
                  'group relative overflow-hidden border-border p-3 transition-all duration-300 hover:border-primary/20 hover:shadow-premium sm:p-fluid-md rounded-2xl',
                  stat.color === 'rose' && 'border-l-8 border-l-rose-500',
                  stat.color === 'indigo' && 'border-l-8 border-l-indigo-600',
                  stat.color === 'emerald' && 'border-l-8 border-l-emerald-500',
                  stat.color === 'amber' && 'border-l-8 border-l-amber-500'
                )}
              >
                <div className="mb-2 flex items-center justify-between sm:mb-4">
                  <div
                    className={cn(
                      'rounded-md p-1.5 transition-transform group-hover:scale-110 sm:p-2',
                      stat.color === 'rose' && 'bg-rose-500/10 text-rose-600',
                      stat.color === 'indigo' && 'bg-indigo-600/10 text-indigo-600',
                      stat.color === 'emerald' && 'bg-emerald-500/10 text-emerald-600',
                      stat.color === 'amber' && 'bg-amber-500/10 text-amber-600'
                    )}
                  >
                    <stat.icon size={16} className="sm:size-5" />
                  </div>
                  {stat.color === 'rose' ? (
                    <div className="flex items-center gap-0.5 text-rose-600">
                      <ArrowDownRight size={10} strokeWidth={3} className="sm:size-12" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5 text-emerald-600">
                      <ArrowUpRight size={10} strokeWidth={3} className="sm:size-12" />
                    </div>
                  )}
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-[8px] font-black tracking-widest text-muted-foreground uppercase sm:text-[10px]">
                    {stat.label}
                  </p>
                  <p className="text-size-base font-black tracking-tight text-foreground sm:text-size-2xl">
                    {isLoading ? <Skeleton className="h-6 w-16 sm:h-8 sm:w-24" /> : stat.value}
                  </p>
                  <p className="text-[7px] font-semibold text-muted-foreground uppercase sm:text-[9px]">
                    {stat.sub}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-fluid-md">
            {/* Recent Activity */}
            <Card
              className="shadow-premium overflow-hidden border-border lg:col-span-8 rounded-2xl"
              padding="none"
            >
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2 sm:p-fluid-md">
                <div className="flex items-center gap-2">
                  <div className="rounded-md border border-border bg-card p-1.5">
                    <Clock size={14} className="text-primary sm:size-5" />
                  </div>
                  <h2 className="text-size-base font-bold tracking-tight text-foreground sm:text-size-xl uppercase">Mouvements</h2>
                </div>
                <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-[9px] font-semibold tracking-widest uppercase sm:h-9 sm:px-3 sm:text-[10px]">
                  <Link href="/dashboard/stocks">Tout voir</Link>
                </Button>
              </div>
              <div className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 sm:p-6">
                      <Skeleton className="h-8 w-8 rounded-md sm:h-10 sm:w-10" />
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-24 sm:h-4 sm:w-32" />
                        <Skeleton className="h-2 w-16 sm:h-3 sm:w-24" />
                      </div>
                      <Skeleton className="ml-auto h-3 w-12 sm:h-4 sm:w-16" />
                    </div>
                  ))
                ) : recentMovements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-muted-foreground sm:p-12">
                    <Package size={24} className="mb-1 opacity-10 sm:size-32 sm:mb-2" />
                    <p className="text-[10px] font-medium italic sm:text-sm uppercase">Aucun mouvement récent.</p>
                  </div>
                ) : (
                  recentMovements.slice(0, 4).map((mov, i) => (
                    <div
                      key={i}
                      className="group flex items-center justify-between p-3 transition-all duration-300 hover:bg-muted/30 sm:p-6"
                    >
                      <div className="flex items-center gap-3 sm:gap-5">
                        <div
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-transform group-hover:scale-110 sm:h-11 sm:w-11',
                            mov.type_mouvement === 'entree'
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                              : 'border-destructive/20 bg-destructive/10 text-destructive'
                          )}
                        >
                          {mov.type_mouvement === 'entree' ? (
                            <TrendingUp size={14} strokeWidth={2.5} className="sm:size-5" />
                          ) : (
                            <TrendingDown size={14} strokeWidth={2.5} className="sm:size-5" />
                          )}
                        </div>
                        <div>
                          <div className="text-size-xs leading-none font-semibold text-foreground transition-colors group-hover:text-primary sm:text-size-base uppercase">
                            {mov.materiaux?.nom}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-[7px] font-semibold tracking-wider text-muted-foreground uppercase sm:mt-2 sm:text-[10px]">
                            <span
                              className={cn(
                                'rounded-md border px-1 py-0.5 sm:px-2',
                                mov.type_mouvement === 'entree'
                                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700'
                                  : 'border-destructive/20 bg-destructive/10 text-destructive'
                              )}
                            >
                              {mov.type_mouvement === 'entree' ? '+' : '-'}
                              {mov.quantite} {mov.materiaux?.unite}
                            </span>
                            <span className="hidden xs:inline">• {mov.chantiers?.nom}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-semibold tracking-tight text-foreground sm:text-xs">
                          {formatDate(mov.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:gap-fluid-md">
              {/* Teams Status */}
              <Card className="shadow-premium overflow-hidden border-border rounded-2xl" padding="none">
                <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2 sm:p-fluid-md">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md border border-border bg-card p-1.5">
                      <Users size={14} className="text-emerald-600 sm:size-5" />
                    </div>
                    <h2 className="text-size-base font-semibold tracking-tight text-foreground uppercase">Équipes</h2>
                  </div>
                </div>
                <div className="p-3 space-y-4 sm:p-fluid-md sm:space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-semibold tracking-widest text-muted-foreground uppercase sm:text-[10px]">Actifs</p>
                      <p className="text-size-base font-semibold text-foreground sm:text-size-xl">{isLoading ? <Skeleton className="h-5 w-8" /> : stats.activeWorkers}</p>
                    </div>
                    <div className="h-6 w-[1px] bg-border sm:h-8" />
                    <div className="space-y-0.5 text-right">
                      <p className="text-[8px] font-semibold tracking-widest text-muted-foreground uppercase sm:text-[10px]">Total</p>
                      <p className="text-size-base font-semibold text-foreground sm:text-size-xl">{isLoading ? <Skeleton className="h-5 w-8 ml-auto" /> : stats.workersCount}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[8px] font-semibold tracking-widest text-muted-foreground uppercase sm:text-[10px]">
                      <span>Activité</span>
                      <span className="text-emerald-600">
                        {isLoading ? '...' : `${Math.round((stats.activeWorkers / (stats.workersCount || 1)) * 100)}%`}
                      </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden sm:h-1.5">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: isLoading ? '0%' : `${(stats.activeWorkers / (stats.workersCount || 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 w-full text-[9px] font-semibold uppercase sm:h-10 sm:text-size-xs"
                  >
                    <Link href="/dashboard/ouvriers">Effectifs</Link>
                  </Button>
                </div>
              </Card>

              {/* Deadlines */}
              <Card className="shadow-premium overflow-hidden border-border rounded-2xl" padding="none">
                <div className="border-b border-border bg-muted/30 px-3 py-2 sm:p-fluid-md">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md border border-border bg-card p-1.5">
                      <AlertCircle size={14} className="text-primary sm:size-5" />
                    </div>
                    <h2 className="text-size-base font-semibold tracking-tight text-foreground uppercase">
                      Échéances
                    </h2>
                  </div>
                </div>
                <div className="space-y-2 bg-card p-3 sm:p-fluid-md sm:space-y-3">
                  {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="rounded-md border border-border bg-muted/30 p-2">
                        <Skeleton className="h-3 w-full rounded-md" />
                      </div>
                    ))
                  ) : recentProjects.length === 0 ? (
                    <p className="py-4 text-center text-[10px] font-semibold text-muted-foreground italic sm:py-6 sm:text-xs uppercase">
                      Aucune échéance.
                    </p>
                  ) : (
                    recentProjects.slice(0, 2).map((proj, i) => (
                      <div
                        key={i}
                        className="group rounded-md border border-border bg-muted/30 p-2 transition-all hover:border-primary/20 hover:bg-card sm:p-3"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="rounded-md bg-primary/10 px-1 py-0.5 text-[7px] font-semibold tracking-widest text-primary uppercase sm:text-[8px]">
                            PROJET
                          </span>
                          <span className="text-[8px] font-semibold text-muted-foreground uppercase sm:text-[9px]">
                            {formatDate(proj.date_fin_prevue)}
                          </span>
                        </div>
                        <p className="truncate text-[10px] font-semibold text-foreground sm:text-size-sm uppercase">
                          {proj.nom}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
