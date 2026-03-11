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
} from 'lucide-react';
import { getDashboardData } from '@/lib/server/dashboard.actions';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/lib/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { ExportModal } from '@/components/dashboard/export-modal';

const CreateProjectModal = dynamic(() => import('@/components/dashboard/create-project-modal').then(mod => mod.CreateProjectModal), {
  loading: () => <Skeleton className="h-9 w-32 rounded-md" />,
  ssr: false
});

export default function DashboardPage() {
  const { enterprise } = useApp();

  const { data, isLoading } = useQuery({
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
  const expensesByCategory = data?.expensesByCategory || {};

  const cards = [
    {
      title: 'Chantiers Actifs',
      value: isLoading ? null : stats.activeProjects.toString(),
      change: '+12%',
      isPositive: true,
      icon: HardHat,
      color: 'bg-primary/10 text-primary',
      href: '/dashboard/chantiers',
    },
    {
      title: 'Effectif Total',
      value: isLoading ? null : stats.workersCount.toString(),
      change: '+3',
      isPositive: true,
      icon: Users,
      color: 'bg-emerald-500/10 text-emerald-600',
      href: '/dashboard/ouvriers',
    },
    {
      title: 'Total Dépenses',
      value: isLoading ? null : formatCurrency(stats.totalExpenses, enterprise?.devise),
      change: '-5%',
      isPositive: true,
      icon: TrendingUp,
      color: 'bg-amber-500/10 text-amber-600',
      href: '/dashboard/budget',
    },
    {
      title: 'Alertes Stock',
      value: isLoading ? null : stats.stockAlerts.toString(),
      change: stats.stockAlerts > 0 ? 'Action requise' : 'Optimal',
      isPositive: stats.stockAlerts === 0,
      icon: Package,
      color: stats.stockAlerts > 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground',
      href: '/dashboard/stocks',
    },
  ];

  return (
    <div className="animate-in fade-in space-y-fluid-lg pb-fluid-xl duration-700">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-1.5">
          <h1 className="text-size-4xl font-semibold tracking-tight text-foreground">Vue d'ensemble</h1>
          <p className="text-size-base font-medium tracking-tight text-muted-foreground">
            Ravi de vous revoir. Voici l'état de vos chantiers aujourd'hui.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportModal />
          <CreateProjectModal onProjectCreated={() => window.location.reload()} />
        </div>
      </div>

      {/* Stats Grid - 4 columns on Mobile/Tablet/Desktop (using auto-cols for flexibility) */}
      <div className="grid grid-cols-1 gap-fluid-md sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <Card
            key={i}
            hoverable
            className="group shadow-premium relative overflow-hidden border-border"
          >
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  'rounded-md p-3 transition-transform duration-300 group-hover:scale-110',
                  card.color
                )}
              >
                <card.icon size={24} strokeWidth={2.5} />
              </div>
              <div
                className={cn(
                  'flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-widest uppercase',
                  card.isPositive
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700'
                    : 'border-destructive/20 bg-destructive/10 text-destructive'
                )}
              >
                {card.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {card.change}
              </div>
            </div>
            <div className="mt-6 space-y-1">
              <p className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">
                {card.title}
              </p>
              <div className="h-9">
                {card.value === null ? (
                  <Skeleton className="h-8 w-24 rounded-md" />
                ) : (
                  <p className="text-size-2xl leading-none font-semibold tracking-tight text-foreground">
                    {card.value}
                  </p>
                )}
              </div>
            </div>
            <Link href={card.href} className="absolute inset-0 z-10" />
          </Card>
        ))}
      </div>

      {/* Main Content Grid - Adaptive 4/8/12 approach */}
      <div className="grid grid-cols-1 gap-fluid-lg lg:grid-cols-12">
        {/* Expenses Preview - 4 columns on Desktop */}
        <Card className="shadow-premium overflow-hidden border-border lg:col-span-4" padding="none">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 p-fluid-md">
            <div className="flex items-center gap-4">
              <div className="rounded-md border border-border bg-card p-2.5">
                <TrendingUp size={20} className="text-amber-600" />
              </div>
              <h2 className="text-size-xl font-semibold tracking-tight text-foreground">Répartition Budget</h2>
            </div>
          </div>
          <div className="p-fluid-md space-y-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))
            ) : Object.keys(expensesByCategory).length === 0 ? (
              <p className="text-center py-10 text-sm font-semibold text-muted-foreground italic">Aucune donnée financière.</p>
            ) : (
              Object.entries(expensesByCategory).map(([cat, amount]: [string, any], i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-semibold tracking-widest uppercase">
                    <span className="text-muted-foreground">{cat.replace('_', ' ')}</span>
                    <span className="text-foreground">{formatCurrency(amount, enterprise?.devise)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min((amount / stats.totalExpenses) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Activity - 8 columns on Desktop */}
        <Card className="shadow-premium overflow-hidden border-border lg:col-span-8" padding="none">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 p-fluid-md">
            <div className="flex items-center gap-4">
              <div className="rounded-md border border-border bg-card p-2.5">
                <Clock size={20} className="text-primary" />
              </div>
              <h2 className="text-size-xl font-semibold tracking-tight text-foreground">
                Activités Récentes
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-md text-[10px] font-semibold tracking-widest text-primary uppercase"
            >
              Voir l'historique
            </Button>
          </div>
          <div className="divide-y divide-border bg-card">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-5">
                    <Skeleton className="h-11 w-11 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="ml-auto h-4 w-20" />
                    <Skeleton className="ml-auto h-3 w-12" />
                  </div>
                </div>
              ))
            ) : recentMovements.length === 0 ? (
              <div className="p-20 text-center text-muted-foreground">
                <Package size={40} className="mx-auto mb-4 opacity-10" />
                <p className="font-semibold italic">Aucune transaction récente à signaler.</p>
              </div>
            ) : (
              recentMovements.map((mov, i) => (
                <div
                  key={i}
                  className="group flex flex-col gap-4 p-6 transition-all duration-300 hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-5">
                    <div
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-md border transition-transform group-hover:scale-110',
                        mov.type_mouvement === 'entree'
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                          : 'border-destructive/20 bg-destructive/10 text-destructive'
                      )}
                    >
                      {mov.type_mouvement === 'entree' ? (
                        <TrendingUp size={20} strokeWidth={2.5} />
                      ) : (
                        <TrendingDown size={20} strokeWidth={2.5} />
                      )}
                    </div>
                    <div>
                      <div className="text-size-base leading-none font-semibold text-foreground transition-colors group-hover:text-primary">
                        {mov.materiaux?.nom}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                        <span
                          className={cn(
                            'rounded-md border px-2 py-0.5',
                            mov.type_mouvement === 'entree'
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700'
                              : 'border-destructive/20 bg-destructive/10 text-destructive'
                          )}
                        >
                          {mov.type_mouvement === 'entree' ? '+' : '-'}
                          {mov.quantite} {mov.materiaux?.unite}
                        </span>
                        • {mov.chantiers?.nom}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xs font-semibold tracking-tight text-foreground">
                      {formatDate(mov.created_at)}
                    </div>
                    <div className="mt-1 text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
                      Enregistré
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Teams Status - 4 columns */}
        <Card className="shadow-premium overflow-hidden border-border lg:col-span-4" padding="none">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 p-fluid-md">
            <div className="flex items-center gap-4">
              <div className="rounded-md border border-border bg-card p-2.5">
                <Users size={20} className="text-emerald-600" />
              </div>
              <h2 className="text-size-xl font-semibold tracking-tight text-foreground">Status Équipes</h2>
            </div>
          </div>
          <div className="p-fluid-md space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Actifs</p>
                <p className="text-size-xl font-semibold text-foreground">{isLoading ? <Skeleton className="h-6 w-10" /> : stats.activeWorkers}</p>
              </div>
              <div className="h-10 w-[1px] bg-border" />
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Total</p>
                <p className="text-size-xl font-semibold text-foreground">{isLoading ? <Skeleton className="h-6 w-10 ml-auto" /> : stats.workersCount}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Taux d'activité</span>
                <span className="text-xs font-semibold text-emerald-600">
                  {isLoading ? '...' : `${Math.round((stats.activeWorkers / (stats.workersCount || 1)) * 100)}%`}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: isLoading ? '0%' : `${(stats.activeWorkers / (stats.workersCount || 1)) * 100}%` }}
                />
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              className="w-full"
            >
              <Link href="/dashboard/ouvriers">Gérer les effectifs</Link>
            </Button>
          </div>
        </Card>

        {/* Deadlines - 4 columns */}
        <Card className="shadow-premium overflow-hidden border-border lg:col-span-4" padding="none">
          <div className="border-b border-border bg-muted/30 p-fluid-md">
            <div className="flex items-center gap-4">
              <div className="rounded-md border border-border bg-card p-2.5">
                <AlertCircle size={20} className="text-primary" />
              </div>
              <h2 className="text-size-xl font-semibold tracking-tight text-foreground">
                Échéances Chantiers
              </h2>
            </div>
          </div>
          <div className="space-y-4 bg-card p-fluid-md">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-md border border-border bg-muted/30 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <Skeleton className="h-4 w-12 rounded-md" />
                    <Skeleton className="h-4 w-20 rounded-md" />
                  </div>
                  <Skeleton className="mb-4 h-6 w-full rounded-md" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))
            ) : recentProjects.length === 0 ? (
              <p className="py-8 text-center text-sm font-semibold text-muted-foreground italic">
                Aucune échéance proche.
              </p>
            ) : (
              recentProjects.map((proj, i) => (
                <div
                  key={i}
                  className="group rounded-md border border-border bg-muted/30 p-5 transition-all hover:border-primary/20 hover:bg-card"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[9px] font-semibold tracking-widest text-primary uppercase">
                      PROJET
                    </span>
                    <span className="text-[10px] font-semibold tracking-tighter text-muted-foreground uppercase">
                      {formatDate(proj.date_fin_prevue)}
                    </span>
                  </div>
                  <p className="text-size-lg leading-tight font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                    {proj.nom}
                  </p>
                  <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-2/3 rounded-full bg-primary transition-all group-hover:shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Reports CTA - 4 columns */}
        <Card
          className="group shadow-elevated relative overflow-hidden border-none bg-primary p-fluid-md text-primary-foreground lg:col-span-4"
          padding="none"
        >
          <div className="relative z-10 space-y-6">
            <div className="w-fit rounded-md border border-white/20 bg-white/10 p-3 backdrop-blur-sm transition-transform group-hover:scale-110">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-size-xl leading-tight font-semibold tracking-tight">Rapports Complets</h3>
              <p className="text-xs leading-relaxed font-medium text-white/80">
                Générez des rapports détaillés (Excel/CSV) pour vos finances et effectifs en quelques secondes.
              </p>
            </div>
            <ExportModal
              trigger={
                <Button className="mt-4 w-full bg-white text-primary hover:bg-white/90">
                  Générer un rapport
                </Button>
              }
            />
          </div>
          <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-white/10 blur-3xl transition-transform duration-700 group-hover:scale-150" />
          <div className="absolute top-0 right-0 -mt-12 -mr-12 h-24 w-24 rounded-full bg-white/5" />
        </Card>
      </div>
    </div>
  );
}
