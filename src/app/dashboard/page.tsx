'use client';

import React, { useEffect, useState } from 'react';
import {
  HardHat,
  Users,
  TrendingUp,
  Package,
  Calendar,
  AlertCircle,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Plus,
  Filter,
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
  loading: () => <Skeleton className="h-10 w-32 rounded-lg" />,
  ssr: false
});

export default function DashboardPage() {
  const { enterprise } = useApp();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      const result = await getDashboardData();
      if (result.error) throw new Error(result.error);

      const stats = {
        projectsCount: result.projects?.length || 0,
        workersCount: result.workersCount || 0,
        activeWorkers: result.workers?.filter((w: any) => w.actif).length || 0,
        totalExpenses:
          result.expenses?.reduce((sum: number, item: any) => sum + item.montant, 0) || 0,
        activeProjects:
          result.projects?.filter((proj: any) => proj.statut === 'en_cours').length || 0,
        stockAlerts: result.alerts?.length || 0,
      };

      const soon =
        result.projects
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
        recentMovements: result.movements || [],
        expensesByCategory: result.expenses?.reduce((acc: any, exp: any) => {
          acc[exp.categorie] = (acc[exp.categorie] || 0) + exp.montant;
          return acc;
        }, {}),
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const stats = data?.stats || {
    projectsCount: 0,
    workersCount: 0,
    activeWorkers: 0,
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
      color: 'bg-indigo-50 text-indigo-600',
      href: '/dashboard/chantiers',
    },
    {
      title: 'Effectif Total',
      value: isLoading ? null : stats.workersCount.toString(),
      change: '+3',
      isPositive: true,
      icon: Users,
      color: 'bg-emerald-50 text-emerald-600',
      href: '/dashboard/ouvriers',
    },
    {
      title: 'Total Dépenses',
      value: isLoading ? null : formatCurrency(stats.totalExpenses, enterprise?.devise),
      change: '-5%',
      isPositive: true,
      icon: TrendingUp,
      color: 'bg-amber-50 text-amber-600',
      href: '/dashboard/budget',
    },
    {
      title: 'Alertes Stock',
      value: isLoading ? null : stats.stockAlerts.toString(),
      change: stats.stockAlerts > 0 ? 'Action requise' : 'Optimal',
      isPositive: stats.stockAlerts === 0,
      icon: Package,
      color: stats.stockAlerts > 0 ? 'bg-red-50 text-red-600' : 'bg-zinc-50 text-zinc-600',
      href: '/dashboard/stocks',
    },
  ];

  return (
    <div className="animate-in fade-in space-y-10 pb-20 duration-700">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-black tracking-tight text-zinc-950">Vue d'ensemble</h1>
          <p className="font-bold tracking-tight text-zinc-500">
            Ravi de vous revoir. Voici l'état de vos chantiers aujourd'hui.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportModal />
          <CreateProjectModal onProjectCreated={() => window.location.reload()} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <Card
            key={i}
            hoverable
            className="group shadow-premium relative overflow-hidden border-none p-8"
            padding="none"
          >
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  'rounded-2xl p-3 shadow-sm transition-transform duration-300 group-hover:scale-110',
                  card.color
                )}
              >
                <card.icon size={24} strokeWidth={2.5} />
              </div>
              <div
                className={cn(
                  'flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black tracking-widest uppercase shadow-sm',
                  card.isPositive
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                    : 'border-red-100 bg-red-50 text-red-700'
                )}
              >
                {card.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {card.change}
              </div>
            </div>
            <div className="mt-6 space-y-1">
              <p className="text-[10px] font-black tracking-[0.15em] text-zinc-400 uppercase">
                {card.title}
              </p>
              <div className="h-9">
                {card.value === null ? (
                  <Skeleton className="h-8 w-24 rounded-lg" />
                ) : (
                  <p className="text-3xl leading-none font-black tracking-tight text-zinc-950">
                    {card.value}
                  </p>
                )}
              </div>
            </div>
            <Link href={card.href} className="absolute inset-0 z-10" />
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Expenses Preview */}
        <Card className="shadow-premium overflow-hidden border-none" padding="none">
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/30 p-8">
            <div className="flex items-center gap-4">
              <div className="rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm">
                <TrendingUp size={20} className="text-amber-600" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-zinc-950">Répartition Budget</h2>
            </div>
          </div>
          <div className="p-8 space-y-6">
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
              <p className="text-center py-10 text-sm font-bold text-zinc-400 italic">Aucune donnée financière.</p>
            ) : (
              Object.entries(expensesByCategory).map(([cat, amount]: [string, any], i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black tracking-widest uppercase">
                    <span className="text-zinc-500">{cat.replace('_', ' ')}</span>
                    <span className="text-zinc-950">{formatCurrency(amount, enterprise?.devise)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
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

        {/* Teams Status */}
        <Card className="shadow-premium overflow-hidden border-none" padding="none">
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/30 p-8">
            <div className="flex items-center gap-4">
              <div className="rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm">
                <Users size={20} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-zinc-950">Status Équipes</h2>
            </div>
          </div>
          <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Actifs</p>
                <p className="text-2xl font-black text-zinc-950">{isLoading ? <Skeleton className="h-6 w-10" /> : stats.activeWorkers}</p>
              </div>
              <div className="h-10 w-[1px] bg-zinc-100" />
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Total</p>
                <p className="text-2xl font-black text-zinc-950">{isLoading ? <Skeleton className="h-6 w-10 ml-auto" /> : stats.workersCount}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">Taux d'activité</span>
                <span className="text-xs font-black text-emerald-600">
                  {isLoading ? '...' : `${Math.round((stats.activeWorkers / (stats.workersCount || 1)) * 100)}%`}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                  style={{ width: isLoading ? '0%' : `${(stats.activeWorkers / (stats.workersCount || 1)) * 100}%` }}
                />
              </div>
            </div>

            <Button 
              asChild 
              variant="outline" 
              className="w-full h-12 rounded-xl border-zinc-100 text-[10px] font-black tracking-widest uppercase hover:bg-zinc-50"
            >
              <Link href="/dashboard/ouvriers">Gérer les effectifs</Link>
            </Button>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-premium overflow-hidden border-none lg:col-span-2" padding="none">
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/30 p-8">
            <div className="flex items-center gap-4">
              <div className="rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm">
                <Clock size={20} className="text-indigo-600" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-zinc-950">
                Activités Récentes
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-[10px] font-black tracking-widest text-indigo-600 uppercase hover:bg-indigo-50"
            >
              Voir l'historique
            </Button>
          </div>
          <div className="divide-y divide-zinc-100 bg-white">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-5">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
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
              <div className="p-20 text-center text-zinc-400">
                <Package size={40} className="mx-auto mb-4 opacity-10" />
                <p className="font-bold italic">Aucune transaction récente à signaler.</p>
              </div>
            ) : (
              recentMovements.map((mov, i) => (
                <div
                  key={i}
                  className="group flex items-center justify-between p-6 transition-all duration-300 hover:bg-zinc-50/50"
                >
                  <div className="flex items-center gap-5">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm transition-transform group-hover:scale-110',
                        mov.type_mouvement === 'entree'
                          ? 'border-emerald-100 bg-emerald-50 text-emerald-600 shadow-emerald-50'
                          : 'border-red-100 bg-red-50 text-red-600 shadow-red-50'
                      )}
                    >
                      {mov.type_mouvement === 'entree' ? (
                        <TrendingUp size={20} strokeWidth={2.5} />
                      ) : (
                        <TrendingDown size={20} strokeWidth={2.5} />
                      )}
                    </div>
                    <div>
                      <div className="text-base leading-none font-black text-zinc-950 transition-colors group-hover:text-indigo-600">
                        {mov.materiaux?.nom}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[10px] font-black tracking-wider text-zinc-400 uppercase">
                        <span
                          className={cn(
                            'rounded-md border px-2 py-0.5',
                            mov.type_mouvement === 'entree'
                              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                              : 'border-red-100 bg-red-50 text-red-700'
                          )}
                        >
                          {mov.type_mouvement === 'entree' ? '+' : '-'}
                          {mov.quantite} {mov.materiaux?.unite}
                        </span>
                        • {mov.chantiers?.nom}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black tracking-tight text-zinc-950">
                      {formatDate(mov.created_at)}
                    </div>
                    <div className="mt-1 text-[9px] font-black tracking-widest text-zinc-400 uppercase">
                      Enregistré
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Deadlines / Alerts */}
        <div className="space-y-8">
          <Card className="shadow-premium overflow-hidden border-none" padding="none">
            <div className="border-b border-zinc-100 bg-zinc-50/30 p-8">
              <div className="flex items-center gap-4">
                <div className="rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm">
                  <AlertCircle size={20} className="text-indigo-600" />
                </div>
                <h2 className="text-xl font-black tracking-tight text-zinc-950">
                  Échéances Chantiers
                </h2>
              </div>
            </div>
            <div className="space-y-4 bg-white p-6">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <Skeleton className="h-4 w-12 rounded-md" />
                      <Skeleton className="h-4 w-20 rounded-md" />
                    </div>
                    <Skeleton className="mb-4 h-6 w-full rounded-md" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))
              ) : recentProjects.length === 0 ? (
                <p className="py-8 text-center text-sm font-black text-zinc-400 italic">
                  Aucune échéance proche.
                </p>
              ) : (
                recentProjects.map((proj, i) => (
                  <div
                    key={i}
                    className="group rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5 transition-all hover:border-indigo-200 hover:bg-white"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[9px] font-black tracking-widest text-indigo-600 uppercase shadow-sm shadow-indigo-50">
                        PROJET
                      </span>
                      <span className="text-[10px] font-black tracking-tighter text-zinc-400 uppercase">
                        {formatDate(proj.date_fin_prevue)}
                      </span>
                    </div>
                    <p className="text-lg leading-tight font-black tracking-tight text-zinc-950 transition-colors group-hover:text-indigo-600">
                      {proj.nom}
                    </p>
                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div className="h-full w-2/3 rounded-full bg-indigo-600 transition-all group-hover:shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card
            className="group shadow-elevated relative overflow-hidden border-none bg-indigo-600 p-10 text-white shadow-indigo-100"
            padding="none"
          >
            <div className="relative z-10 space-y-6">
              <div className="w-fit rounded-2xl border border-white/20 bg-white/10 p-3 shadow-sm backdrop-blur-sm transition-transform group-hover:scale-110">
                <TrendingUp size={24} className="text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl leading-tight font-black tracking-tight">Rapports Complets</h3>
                <p className="text-xs leading-relaxed font-bold text-indigo-100 opacity-80">
                  Générez des rapports détaillés (Excel/CSV) pour vos finances et effectifs en quelques secondes.
                </p>
              </div>
              <ExportModal 
                trigger={
                  <Button className="mt-4 h-14 w-full rounded-2xl border-none bg-white text-[11px] font-black tracking-widest text-indigo-600 uppercase shadow-xl hover:bg-indigo-50">
                    Générer un rapport
                  </Button>
                }
              />
            </div>
            {/* Abstract decoration */}
            <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-white/10 blur-3xl transition-transform duration-700 group-hover:scale-150" />
            <div className="absolute top-0 right-0 -mt-12 -mr-12 h-24 w-24 rounded-full bg-white/5" />
          </Card>
        </div>
      </div>
    </div>
  );
}
