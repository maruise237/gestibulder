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
              proj.statut !== 'termine' &&
              proj.date_fin_prevue &&
              new Date(proj.date_fin_prevue) > new Date()
          )
          .sort(
            (a: any, b: any) =>
              new Date(a.date_fin_prevue).getTime() - new Date(b.date_fin_prevue).getTime()
          )
          .slice(0, 3) || [];

      return {
        stats,
        recentProjects: soon,
        recentMovements: data.movements || [],
        expensesByCategory: data.expenses?.reduce((acc: any, exp: any) => {
          acc[exp.categorie] = (acc[exp.categorie] || 0) + exp.montant;
          return acc;
        }, {}),
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  const stats = data?.stats || {
    projectsCount: 0,
    workersCount: 0, activeWorkers: 0,
    totalExpenses: 0,
    activeProjects: 0,
    stockAlerts: 0,
  };
  const recentProjects = data?.recentProjects || [];
  const recentMovements = data?.recentMovements || [];

  const cards = [
    {
      title: 'Chantiers',
      value: isLoading ? null : stats.activeProjects.toString(),
      change: '+12%',
      isPositive: true,
      icon: HardHat,
      color: 'bg-primary/10 text-primary',
      href: '/dashboard/chantiers',
    },
    {
      title: 'Effectif',
      value: isLoading ? null : stats.workersCount.toString(),
      change: '+3',
      isPositive: true,
      icon: Users,
      color: 'bg-emerald-500/10 text-emerald-600',
      href: '/dashboard/ouvriers',
    },
    {
      title: 'Budget',
      value: isLoading ? null : formatCurrency(stats.totalExpenses, enterprise?.devise || 'DA'),
      change: '-5%',
      isPositive: false,
      icon: TrendingUp,
      color: 'bg-indigo-500/10 text-indigo-600',
      href: '/dashboard/budget',
    },
    {
      title: 'Stocks',
      value: isLoading ? null : stats.stockAlerts.toString(),
      change: stats.stockAlerts > 0 ? 'Alerte' : 'Ok',
      isPositive: stats.stockAlerts === 0,
      icon: Package,
      color: stats.stockAlerts > 0 ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600',
      href: '/dashboard/stocks',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl">Tableau de bord</h1>
          <p className="hidden text-size-xs font-medium text-muted-foreground sm:block">
            L'état de vos chantiers aujourd'hui.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportModal />
          <CreateProjectModal
            onProjectCreated={refetch}
            trigger={
              <Button size="sm" className="h-9 px-3 text-[10px] font-bold uppercase tracking-widest">
                <Plus size={14} className="mr-2" />
                Nouveau Projet
              </Button>
            }
          />
        </div>
      </div>

      {/* Stats Grid - 2 columns on Mobile, 4 on Desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-fluid-md lg:grid-cols-4">
        {cards.map((card, i) => (
          <Card
            key={i}
            hoverable
            size="sm"
            className="group shadow-premium relative overflow-hidden border-border p-3 sm:p-fluid-md"
          >
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  'rounded-md p-1.5 transition-transform duration-300 group-hover:scale-110 sm:p-3',
                  card.color
                )}
              >
                <card.icon size={16} strokeWidth={2.5} className="sm:size-6" />
              </div>
              <div
                className={cn(
                  'flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[7px] font-semibold tracking-widest uppercase sm:gap-1 sm:px-2.5 sm:py-1 sm:text-[10px]',
                  card.isPositive
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700'
                    : 'border-destructive/20 bg-destructive/10 text-destructive'
                )}
              >
                {card.isPositive ? <ArrowUpRight size={8} className="sm:size-3" /> : <ArrowDownRight size={8} className="sm:size-3" />}
                <span>{card.change}</span>
              </div>
            </div>
            <div className="mt-2 space-y-0 sm:mt-4 sm:space-y-1">
              <p className="text-[8px] font-semibold tracking-widest text-muted-foreground uppercase sm:text-[10px]">
                {card.title}
              </p>
              <h3 className="text-size-base font-semibold tracking-tight text-foreground sm:text-size-xl">
                {card.value === null ? <Skeleton className="h-5 w-10" /> : card.value}
              </h3>
            </div>
            {/* Minimal Decorative pattern */}
            <div className="absolute -right-1 -bottom-1 opacity-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
              <card.icon size={48} strokeWidth={1} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-fluid-md">
        {/* Recent Activity - 8 columns */}
        <Card className="shadow-premium overflow-hidden border-border lg:col-span-8" padding="none">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2 sm:p-fluid-md">
            <div className="flex items-center gap-2">
              <div className="rounded-md border border-border bg-card p-1.5 sm:p-2">
                <Clock size={14} className="text-primary sm:size-5" />
              </div>
              <h2 className="text-size-base font-semibold tracking-tight text-foreground sm:text-size-xl">Mouvements</h2>
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
                <p className="text-[10px] font-medium italic sm:text-sm">Aucun mouvement récent.</p>
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
                      <div className="text-size-xs leading-none font-semibold text-foreground transition-colors group-hover:text-primary sm:text-size-base">
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
          <Card className="shadow-premium overflow-hidden border-border" padding="none">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2 sm:p-fluid-md">
              <div className="flex items-center gap-2">
                <div className="rounded-md border border-border bg-card p-1.5">
                  <Users size={14} className="text-emerald-600 sm:size-5" />
                </div>
                <h2 className="text-size-base font-semibold tracking-tight text-foreground">Équipes</h2>
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
          <Card className="shadow-premium overflow-hidden border-border" padding="none">
            <div className="border-b border-border bg-muted/30 px-3 py-2 sm:p-fluid-md">
              <div className="flex items-center gap-2">
                <div className="rounded-md border border-border bg-card p-1.5">
                  <AlertCircle size={14} className="text-primary sm:size-5" />
                </div>
                <h2 className="text-size-base font-semibold tracking-tight text-foreground">
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
                <p className="py-4 text-center text-[10px] font-semibold text-muted-foreground italic sm:py-6 sm:text-xs">
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
                    <p className="truncate text-[10px] font-semibold text-foreground sm:text-size-sm">
                      {proj.nom}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
