'use client';

import React, { useEffect, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Calculator,
  Plus,
  Loader2,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Search,
  ChevronRight,
  MoreVertical,
  HardHat,
} from 'lucide-react';
import { getBudgetData } from '@/lib/server/dashboard.actions';
import { Expense } from '@/types/expense';
import { Project } from '@/types/project';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/lib/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { ExportModal } from '@/components/dashboard/export-modal';

const CreateExpenseModal = dynamic(() => import('@/components/dashboard/create-expense-modal').then(mod => mod.CreateExpenseModal), {
  loading: () => <Skeleton className="h-10 w-32 rounded-lg" />,
  ssr: false
});

export default function BudgetPage() {
  const { enterprise } = useApp();
  const [selectedChantier, setSelectedChantier] = useState('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['budget-data'],
    queryFn: async () => {
      const data = await getBudgetData();
      if (data.error) throw new Error(data.error);
      return {
        projects: data.projects || [],
        expenses: data.expenses || [],
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const projects = data?.projects || [];
  const expenses = data?.expenses || [];

  const filteredExpenses =
    selectedChantier === 'all'
      ? expenses
      : expenses.filter((e) => e.chantier_id === selectedChantier);

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.montant, 0);

  const getMargin = () => {
    if (selectedChantier === 'all') return null;
    const project = projects.find((p) => p.id === selectedChantier);
    if (!project || !project.budget_total) return null;
    const margin = ((project.budget_total - totalExpenses) / project.budget_total) * 100;
    return margin.toFixed(1);
  };

  const margin = getMargin();

  return (
    <div className="animate-in fade-in space-y-10 pb-20 duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-black tracking-tight text-zinc-950">Finances & Budget</h1>
          <p className="font-bold tracking-tight text-zinc-500 italic">
            Surveillez les dépenses des chantiers et optimisez vos marges opérationnelles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportModal />
          <CreateExpenseModal projects={projects} onExpenseCreated={refetch} />
        </div>
      </div>

      {/* Financial Stats Grid */}
      <div className="grid gap-8 md:grid-cols-3">
        <Card
          className="shadow-premium group relative overflow-hidden border-l-8 border-none border-l-indigo-600 p-8"
          padding="none"
        >
          <div className="mb-6 flex items-center gap-4">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3 text-indigo-600 shadow-sm shadow-indigo-50 transition-transform group-hover:scale-110">
              <Wallet size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-black tracking-[0.2em] text-zinc-400 uppercase">
              Total des Dépenses
            </span>
          </div>
          <p className="text-4xl leading-none font-black tracking-tighter text-zinc-950">
            {isLoading ? (
              <Skeleton className="h-10 w-48 rounded-lg" />
            ) : (
              formatCurrency(totalExpenses, enterprise?.devise)
            )}
          </p>
          <div className="mt-4 flex items-center gap-2 text-emerald-600">
            <ArrowDownRight size={16} />
            <span className="text-[10px] font-black tracking-widest uppercase">
              Dans les prévisions
            </span>
          </div>
          <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-indigo-600/5 transition-transform group-hover:scale-110" />
        </Card>

        <Card
          className={cn(
            'shadow-premium group relative overflow-hidden border-l-8 border-none p-8',
            margin && Number(margin) > 0 ? 'border-l-emerald-500' : 'border-l-red-500'
          )}
          padding="none"
        >
          <div className="mb-6 flex items-center gap-4">
            <div
              className={cn(
                'rounded-2xl border p-3 shadow-sm transition-transform group-hover:scale-110',
                margin && Number(margin) > 0
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-600 shadow-emerald-50'
                  : 'border-red-100 bg-red-50 text-red-600 shadow-red-50'
              )}
            >
              {margin && Number(margin) > 0 ? (
                <TrendingUp size={24} strokeWidth={2.5} />
              ) : (
                <TrendingDown size={24} strokeWidth={2.5} />
              )}
            </div>
            <span className="text-[11px] font-black tracking-[0.2em] text-zinc-400 uppercase">
              Marge Estimée
            </span>
          </div>
          <p
            className={cn(
              'text-4xl leading-none font-black tracking-tighter',
              margin && Number(margin) > 0 ? 'text-emerald-600' : 'text-red-600'
            )}
          >
            {isLoading ? (
              <Skeleton className="h-10 w-24 rounded-lg" />
            ) : margin ? (
              `${margin}%`
            ) : (
              '--'
            )}
          </p>
          <p className="mt-4 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
            {selectedChantier === 'all'
              ? "Sélectionnez un chantier pour l'analyse"
              : 'Rentabilité du projet actuel'}
          </p>
        </Card>

        <Card
          className="shadow-premium group border-l-8 border-none border-l-zinc-900 p-8"
          padding="none"
        >
          <div className="mb-6 flex items-center gap-4">
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-zinc-900 shadow-sm transition-transform group-hover:scale-110">
              <Calculator size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-black tracking-[0.2em] text-zinc-400 uppercase">
              Volume Transactions
            </span>
          </div>
          <p className="text-4xl leading-none font-black tracking-tighter text-zinc-950">
            {isLoading ? <Skeleton className="h-10 w-16 rounded-lg" /> : filteredExpenses.length}
          </p>
          <p className="mt-4 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
            Écritures comptables
          </p>
        </Card>
      </div>

      {/* Transaction Ledger */}
      <Card className="shadow-premium overflow-hidden border-none" padding="none">
        <div className="flex flex-col justify-between gap-8 border-b border-zinc-100 bg-zinc-50/30 p-10 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm">
              <Calendar size={20} className="text-indigo-600" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-zinc-950 uppercase">
              Grand Livre des Dépenses
            </h2>
          </div>

          <div className="group relative min-w-[300px]">
            <HardHat
              className="absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-indigo-600"
              size={18}
            />
            <select
              className="h-12 w-full cursor-pointer appearance-none rounded-2xl border border-zinc-200 bg-white pr-6 pl-12 text-[11px] font-black tracking-widest uppercase transition-all outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5"
              value={selectedChantier}
              onChange={(e) => setSelectedChantier(e.target.value)}
            >
              <option value="all">Vue Globale (Tous les chantiers)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 text-zinc-400">
              <Plus size={16} />
            </div>
          </div>
        </div>

        {isLoading && expenses.length === 0 ? (
          <div className="divide-y divide-zinc-100 bg-white">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-8">
                <div className="flex items-center gap-6">
                  <Skeleton className="h-14 w-14 rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48 rounded-md" />
                    <div className="flex gap-3">
                      <Skeleton className="h-4 w-20 rounded-md" />
                      <Skeleton className="h-4 w-24 rounded-md" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="space-y-2">
                    <Skeleton className="ml-auto h-6 w-32 rounded-md" />
                    <Skeleton className="ml-auto h-3 w-12 rounded-md" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : !isLoading && filteredExpenses.length === 0 ? (
          <div className="p-32 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-50">
              <Calculator size={40} className="text-zinc-950 opacity-10" />
            </div>
            <p className="text-lg font-black tracking-tight text-zinc-400 italic">
              Aucune transaction enregistrée pour cette période.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 bg-white">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="group flex items-center justify-between p-8 transition-all duration-300 hover:bg-zinc-50/50"
              >
                <div className="flex items-center gap-6">
                  <div
                    className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-2xl border shadow-sm transition-all duration-300 group-hover:scale-110',
                      expense.categorie === 'materiaux'
                        ? 'border-amber-100 bg-amber-50 text-amber-600 shadow-amber-50'
                        : expense.categorie === 'main_d_oeuvre'
                          ? 'border-indigo-100 bg-indigo-50 text-indigo-600 shadow-indigo-50'
                          : 'border-zinc-100 bg-zinc-50 text-zinc-600 shadow-zinc-50'
                    )}
                  >
                    {expense.categorie === 'materiaux' ? (
                      <Package size={24} strokeWidth={2.5} />
                    ) : (
                      <Calculator size={24} strokeWidth={2.5} />
                    )}
                  </div>
                  <div>
                    <div className="text-xl leading-tight font-black tracking-tight text-zinc-950 transition-colors group-hover:text-indigo-600">
                      {expense.libelle}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                        {new Date(expense.date).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                        • {expense.categorie.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-2xl leading-none font-black tracking-tighter text-red-600">
                      - {formatCurrency(expense.montant, enterprise?.devise)}
                    </div>
                    <div className="mt-2 text-[10px] font-black tracking-[0.2em] text-emerald-600 uppercase">
                      Payé
                    </div>
                  </div>
                  <button className="rounded-xl border border-transparent p-2 text-zinc-300 shadow-sm transition-all hover:border-zinc-100 hover:bg-white hover:text-indigo-600">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
