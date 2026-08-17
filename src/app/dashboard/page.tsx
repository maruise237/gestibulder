'use client';

import React from 'react';
import {
  Package,
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
          <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
            <div className="space-y-1">
              <h1 className="text-size-2xl font-medium text-foreground sm:text-size-3xl">Tableau de bord</h1>
              <p className="text-size-sm text-muted-foreground">
                {isLoading ? (
                  <Skeleton className="h-4 w-48" />
                ) : (
                  `Vue d'ensemble — ${stats.projectsCount} chantier${stats.projectsCount > 1 ? 's' : ''}`
                )}
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <ExportModal enterprise={enterprise} />
              <CreateProjectModal onProjectCreated={() => refetch()} />
            </div>
          </div>

          <div className="grid grid-cols-2 divide-y divide-x divide-border border border-border sm:grid-cols-4 sm:divide-y-0">
            {/* Quick Stats — la typographie porte la hiérarchie, pas des icônes dans des carrés colorés */}
            {[
              {
                label: 'Chantiers en cours',
                value: stats.activeProjects,
                sub: `sur ${stats.projectsCount} au total`,
                tone: 'default',
              },
              {
                label: 'Dépenses cumulées',
                value: formatCurrency(stats.totalExpenses, enterprise?.devise),
                sub: 'tous chantiers confondus',
                tone: 'default',
                tabular: true,
              },
              {
                label: 'Effectif présent',
                value: stats.activeWorkers,
                sub: `sur ${stats.workersCount} ouvriers`,
                tone: 'success',
              },
              {
                label: 'Alertes stock',
                value: stats.stockAlerts,
                sub: stats.stockAlerts > 0 ? 'à traiter' : 'aucune alerte',
                tone: stats.stockAlerts > 0 ? 'warning' : 'success',
              },
            ].map((stat, i) => (
              <div key={i} className="p-4 sm:p-6">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={cn(
                  'font-display mt-1.5 text-2xl font-medium sm:text-3xl',
                  stat.tabular && 'font-tabular text-xl sm:text-2xl',
                  stat.tone === 'success' && 'text-success',
                  stat.tone === 'warning' && 'text-warning'
                )}>
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stat.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-fluid-md">
            {/* Recent Activity */}
            <Card
              className="overflow-hidden border-border lg:col-span-8 rounded-2xl"
              padding="none"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4">
                <h2 className="font-display text-lg font-medium text-foreground sm:text-xl">Mouvements récents</h2>
                <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs font-medium sm:h-9 sm:px-3">
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
                      className="flex items-center justify-between p-4 transition-colors hover:bg-muted/30 sm:px-6"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'font-tabular w-16 shrink-0 text-right text-sm font-medium sm:w-20 sm:text-base',
                            mov.type_mouvement === 'entree' ? 'text-success' : 'text-destructive'
                          )}
                        >
                          {mov.type_mouvement === 'entree' ? '+' : '−'}{mov.quantite}
                        </div>
                        <div>
                          <div className="text-size-xs leading-none font-medium text-foreground sm:text-size-base">
                            {mov.materiaux?.nom}
                            <span className="ml-1 font-normal text-muted-foreground">{mov.materiaux?.unite}</span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {mov.chantiers?.nom}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-tabular text-xs text-muted-foreground">
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
              <Card className="overflow-hidden border-border" padding="none">
                <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4">
                  <h2 className="font-display text-lg font-medium text-foreground">Équipes</h2>
                </div>
                <div className="p-3 space-y-4 sm:p-fluid-md sm:space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Actifs</p>
                      <p className="font-tabular text-size-base font-medium text-foreground sm:text-size-xl">{isLoading ? <Skeleton className="h-5 w-8" /> : stats.activeWorkers}</p>
                    </div>
                    <div className="h-6 w-[1px] bg-border sm:h-8" />
                    <div className="space-y-0.5 text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-tabular text-size-base font-medium text-foreground sm:text-size-xl">{isLoading ? <Skeleton className="h-5 w-8 ml-auto" /> : stats.workersCount}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Activité</span>
                      <span className="font-tabular text-success">
                        {isLoading ? '...' : `${Math.round((stats.activeWorkers / (stats.workersCount || 1)) * 100)}%`}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-success transition-all duration-1000"
                        style={{ width: isLoading ? '0%' : `${(stats.activeWorkers / (stats.workersCount || 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-9 w-full text-xs"
                  >
                    <Link href="/dashboard/ouvriers">Voir l'effectif</Link>
                  </Button>
                </div>
              </Card>

              {/* Deadlines */}
              <Card className="overflow-hidden border-border" padding="none">
                <div className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
                  <h2 className="font-display text-lg font-medium text-foreground">
                    Échéances
                  </h2>
                </div>
                <div className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="p-4">
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))
                  ) : recentProjects.length === 0 ? (
                    <p className="p-6 text-center text-xs text-muted-foreground">
                      Aucune échéance.
                    </p>
                  ) : (
                    recentProjects.slice(0, 2).map((proj, i) => (
                      <div
                        key={i}
                        className="p-4 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-size-sm font-medium text-foreground">
                            {proj.nom}
                          </p>
                          <span className="font-tabular shrink-0 text-xs text-muted-foreground">
                            {formatDate(proj.date_fin_prevue)}
                          </span>
                        </div>
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
