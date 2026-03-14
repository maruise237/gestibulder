'use client';

import React from 'react';
import { getBudgetData } from '@/lib/server/dashboard.actions';
import {
  Wallet,
  Calculator, Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  MoreVertical,
  Package,
  HardHat,
  ArrowDownRight,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/lib/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { CreateExpenseModal } from '@/components/dashboard/create-expense-modal';
import { ExportModal } from '@/components/dashboard/export-modal';

export default function BudgetPage() {
  const { enterprise, selectedProjectId } = useApp();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['budget-data', selectedProjectId],
    queryFn: async () => {
      const result = await getBudgetData();
      if (result.error) throw new Error(result.error);
      return result;
    },
    staleTime: 0,
  });

  const projects = data?.projects || [];
  const expenses = data?.expenses || [];

  const filteredExpenses =
    !selectedProjectId || selectedProjectId === 'all'
      ? expenses
      : expenses.filter((e) => e.chantier_id === selectedProjectId);

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.montant, 0);

  const selectedProjectObj = projects.find((p) => p.id === selectedProjectId);
  const margin =
    selectedProjectObj && selectedProjectObj.budget_total > 0
      ? (((selectedProjectObj.budget_total - totalExpenses) / selectedProjectObj.budget_total) * 100).toFixed(1)
      : null;

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl">Finances</h1>
          <p className="hidden text-size-xs font-medium text-muted-foreground sm:block">
            Suivi des dépenses et rentabilité des chantiers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportModal />
          <CreateExpenseModal onExpenseCreated={refetch} />
        </div>
      </div>

      {/* Alerte budget dépassé */}
      {selectedProjectObj && totalExpenses > selectedProjectObj.budget_total && selectedProjectObj.budget_total > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-destructive">Budget dépassé</p>
            <p className="text-[10px] font-semibold text-destructive/80">
              Dépassement de {formatCurrency(totalExpenses - selectedProjectObj.budget_total, enterprise?.devise)}
              sur le budget alloué de {formatCurrency(selectedProjectObj.budget_total, enterprise?.devise)}
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
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
            {!selectedProjectId ? 'Toutes les marges' : 'Rentabilité projet'}
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

      {/* Transaction Ledger */}
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
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
             Filtré par le sélecteur central
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
          <div className="py-20 text-center">
            <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-background shadow-premium">
              <Calculator size={40} className="text-primary/20" />
              <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-premium animate-bounce">
                <Plus size={16} />
              </div>
            </div>
            <h2 className="mb-2 text-size-xl font-semibold tracking-tight text-foreground uppercase">
              Grand Livre vide
            </h2>
            <p className="mx-auto mb-10 max-w-sm text-size-sm font-medium text-muted-foreground italic">
              Aucune transaction n'a été enregistrée pour ce chantier. Saisissez vos premi\u00e8res dépenses pour suivre la rentabilité.
            </p>
            <CreateExpenseModal onExpenseCreated={refetch}>
               <Button className="h-11 rounded-xl px-8 font-bold uppercase tracking-widest shadow-premium transition-all hover:scale-105 active:scale-95">
                 Saisir une dépense
               </Button>
            </CreateExpenseModal>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredExpenses.map((expense) => (
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
                      <span>{new Date(expense.date_operation).toLocaleDateString()}</span>
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
