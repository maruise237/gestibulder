'use client';

import React from 'react';
import { getBudgetData } from '@/lib/server/dashboard.actions';
import {
  Wallet,
  Calculator,
  TrendingUp,
  TrendingDown,
  Calendar,
  MoreVertical,
  Package,
  ArrowDownRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { useApp } from '@/lib/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { CreateExpenseModal } from '@/components/dashboard/create-expense-modal';
import { ExportModal } from '@/components/dashboard/export-modal';

export default function BudgetPage() {
  const { enterprise, selectedProjectId: selectedChantier } = useApp();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['budget-data'],
    queryFn: async () => {
      const result = await getBudgetData();
      if (result.error) throw new Error(result.error);
      return result;
    },
    staleTime: 1000 * 60 * 5,
  });

  const projects = data?.projects || [];
  const expenses = data?.expenses || [];

  const filteredExpenses =
    !selectedChantier
      ? expenses
      : expenses.filter((e: any) => e.chantier_id === selectedChantier);

  const totalExpenses = filteredExpenses.reduce((sum: number, exp: any) => sum + exp.montant, 0);

  const selectedProjectObj = projects.find((p: any) => p.id === selectedChantier);
  const margin =
    selectedProjectObj && selectedProjectObj.budget_total > 0
      ? (((selectedProjectObj.budget_total - totalExpenses) / selectedProjectObj.budget_total) * 100).toFixed(1)
      : null;

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl">Finances</h1>
          <p className="hidden text-size-xs font-medium text-muted-foreground sm:block">
            Suivi des dépenses et rentabilité des chantiers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportModal />
          <CreateExpenseModal projects={projects} onExpenseCreated={refetch} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-fluid-md">
        <Card className="group relative overflow-hidden border-border p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <Wallet size={18} />
            </div>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Total Dépenses
            </span>
          </div>
          <p className="text-size-2xl font-semibold tracking-tight text-foreground">
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              formatCurrency(totalExpenses, enterprise?.devise)
            )}
          </p>
          <div className="mt-2 flex items-center gap-1 text-emerald-600">
            <ArrowDownRight size={14} />
            <span className="text-[9px] font-semibold tracking-widest uppercase">
              Actualisé
            </span>
          </div>
        </Card>

        <Card className="group relative overflow-hidden border-border p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className={cn(
              "rounded-md p-2",
              margin && Number(margin) > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
            )}>
              {margin && Number(margin) > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Marge Estimée
            </span>
          </div>
          <p className={cn(
            "text-size-2xl font-semibold tracking-tight",
            margin && Number(margin) > 0 ? "text-emerald-600" : "text-destructive"
          )}>
            {isLoading ? <Skeleton className="h-8 w-20" /> : margin ? `${margin}%` : '--'}
          </p>
          <p className="mt-2 text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
            {!selectedChantier ? 'Sélectionnez un projet' : 'Rentabilité projet'}
          </p>
        </Card>

        <Card className="group relative overflow-hidden border-border p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-md bg-muted p-2 text-foreground">
              <Calculator size={18} />
            </div>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Transactions
            </span>
          </div>
          <p className="text-size-2xl font-semibold tracking-tight text-foreground">
            {isLoading ? <Skeleton className="h-8 w-12" /> : filteredExpenses.length}
          </p>
          <p className="mt-2 text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
            Nombre d'écritures
          </p>
        </Card>
      </div>

      <Card className="shadow-premium overflow-hidden border-border" padding="none">
        <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/30 p-4 sm:p-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-md border border-border bg-card p-2">
              <Calendar size={18} className="text-primary" />
            </div>
            <h2 className="text-size-lg font-semibold tracking-tight text-foreground">
              Grand Livre
            </h2>
          </div>
        </div>

        {isLoading && expenses.length === 0 ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 sm:p-6">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex-1 px-4 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Calculator size={32} className="mx-auto mb-2 opacity-10" />
            <p className="text-xs font-medium italic">Aucune transaction enregistrée.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredExpenses.map((expense: any) => (
              <div
                key={expense.id}
                className="group flex items-center justify-between p-4 transition-all duration-200 hover:bg-muted/30 sm:p-6"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-transform group-hover:scale-110',
                    expense.categorie === 'materiaux' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-primary/10 text-primary border-primary/20'
                  )}>
                    {expense.categorie === 'materiaux' ? <Package size={18} /> : <Calculator size={18} />}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-size-sm font-semibold text-foreground group-hover:text-primary">
                      {expense.libelle}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[9px] font-semibold text-muted-foreground uppercase">
                      <span>{new Date(expense.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{expense.categorie.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-right">
                    <div className="text-size-sm font-semibold text-destructive sm:text-size-base">
                      - {formatCurrency(expense.montant, enterprise?.devise)}
                    </div>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground">
                    <MoreVertical size={16} />
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
