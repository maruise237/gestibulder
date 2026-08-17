'use client';

import React from 'react';
import { getBudgetData } from '@/lib/server/dashboard.actions';
import {
  Calculator,
  MoreVertical,
  AlertCircle,
  Users,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { label, EXPENSE_CATEGORY_LABELS } from '@/lib/labels';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/lib/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { CreateExpenseModal } from '@/components/dashboard/create-expense-modal';
import { ExportModal } from '@/components/dashboard/export-modal';
import { EmptyState } from '@/components/dashboard/empty-state';
import Link from 'next/link';

export default function BudgetPage() {
  const { enterprise, selectedProjectId } = useApp();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['budget-data', selectedProjectId],
    queryFn: async () => {
      const result = await getBudgetData(selectedProjectId || undefined);
      if (result.error) throw new Error(result.error);
      return result;
    },
    staleTime: 0,
  });

  const projects = data?.projects || [];
  const expenses = data?.expenses || [];
  const nonLaborExpenses = data?.nonLaborExpenses || [];
  const laborSummary = data?.laborSummary;

  // Real-time financial calculations
  // 1. Total paid from non-labor categories (materials, transport, etc.)
  const totalNonLaborPaid = nonLaborExpenses
    .filter(e => !selectedProjectId || selectedProjectId === 'all' || e.chantier_id === selectedProjectId)
    .reduce((sum, e) => sum + (Number(e.montant) || 0), 0);

  // 2. Total labor cost (Source of truth: Pointage)
  const totalLaborCost = laborSummary?.workers.reduce((sum: number, w: any) => sum + w.totalDue, 0) || 0;

  // 3. Actual paid labor (Source of truth: Payments)
  const totalLaborPaid = laborSummary?.workers.reduce((sum: number, w: any) => sum + w.totalPaid, 0) || 0;

  // 4. Financial Pressure (Everything the enterprise must pay eventually)
  const totalEngaged = totalNonLaborPaid + totalLaborCost;

  // 5. Unpaid Debt
  const totalLaborDebt = Math.max(0, totalLaborCost - totalLaborPaid);

  const selectedProjectObj = projects.find((p) => p.id === selectedProjectId);
  const budgetTotal = selectedProjectObj?.budget_total || 0;
  const budgetRemaining = Math.max(0, budgetTotal - totalEngaged);

  const margin =
    budgetTotal > 0
      ? (((budgetTotal - totalEngaged) / budgetTotal) * 100).toFixed(1)
      : null;

  const filteredExpensesForTable = !selectedProjectId || selectedProjectId === 'all'
    ? expenses
    : expenses.filter((e) => e.chantier_id === selectedProjectId);

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-size-2xl font-medium text-foreground sm:text-size-3xl">Finances</h1>
          <p className="hidden text-size-sm text-muted-foreground sm:block">
            Suivi des dépenses et rentabilité des chantiers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard/budget/personnel">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground h-9 px-4">
               <Users size={14} className="mr-2" />
               Paiements personnel
            </Button>
          </Link>
          <ExportModal />
          <CreateExpenseModal onExpenseCreated={refetch} />
        </div>
      </div>

      {/* Alerte budget dépassé */}
      {selectedProjectObj && totalEngaged > budgetTotal && budgetTotal > 0 && (
        <div className="flex items-center gap-3 border border-destructive/20 bg-destructive/5 p-4">
          <AlertCircle size={20} className="shrink-0 text-destructive" />
          <div className="min-w-0">
            <p className="text-size-sm font-medium text-destructive">Risque budgétaire élevé</p>
            <p className="font-tabular text-xs text-destructive/80">
              Dépassement de {formatCurrency(totalEngaged - budgetTotal, enterprise?.devise)} (matériaux + personnel pointé)
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 divide-y divide-x divide-border border border-border md:grid-cols-4 md:divide-y-0">
        <div className="p-4 sm:p-6">
          <p className="text-xs text-muted-foreground">Budget engagé</p>
          <p className="font-tabular mt-1.5 text-size-xl font-medium text-foreground sm:text-size-2xl">
            {isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(totalEngaged, enterprise?.devise)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Personnel + matériaux</p>
        </div>

        <div className="p-4 sm:p-6">
          <p className="text-xs text-muted-foreground">Impayés (dettes)</p>
          <p className="font-tabular mt-1.5 text-size-xl font-medium text-destructive sm:text-size-2xl">
            {isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(totalLaborDebt, enterprise?.devise)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Salaires dus à ce jour</p>
        </div>

        <div className="p-4 sm:p-6">
          <p className="text-xs text-muted-foreground">Budget restant</p>
          <p className="font-tabular mt-1.5 text-size-xl font-medium text-success sm:text-size-2xl">
            {isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(budgetRemaining, enterprise?.devise)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Trésorerie théorique</p>
        </div>

        <div className="p-4 sm:p-6">
          <p className="text-xs text-muted-foreground">Rentabilité</p>
          <p className={cn(
            "font-tabular mt-1.5 text-size-xl font-medium sm:text-size-2xl",
            margin && Number(margin) > 0 ? "text-success" : "text-destructive"
          )}>
            {isLoading ? <Skeleton className="h-8 w-20" /> : margin ? `${margin}%` : '—'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Santé financière globale</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Transaction Ledger */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-border" padding="none">
            <div className="flex flex-col justify-between gap-2 border-b border-border p-4 sm:p-6 md:flex-row md:items-center">
              <h2 className="font-display text-lg font-medium text-foreground">
                Grand livre
              </h2>
              <div className="text-xs text-muted-foreground">
                Historique des sorties
              </div>
            </div>

            {isLoading && filteredExpensesForTable.length === 0 ? (
              <div className="divide-y divide-border">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 sm:p-6">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            ) : filteredExpensesForTable.length === 0 ? (
              <EmptyState
                icon={Calculator}
                title="Historique vide"
                description="Aucune transaction n'a été enregistrée."
                action={<CreateExpenseModal onExpenseCreated={refetch} />}
              />
            ) : (
              <div className="divide-y divide-border">
                {filteredExpensesForTable.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 transition-colors hover:bg-muted/30 sm:p-6"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-size-sm font-medium text-foreground">
                        {expense.libelle}
                      </div>
                      <div className="font-tabular mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(expense.date_operation).toLocaleDateString()}</span>
                        <span>·</span>
                        <span className="font-sans">{label(EXPENSE_CATEGORY_LABELS, expense.categorie)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-tabular text-size-sm font-medium text-destructive sm:text-size-base">
                        − {formatCurrency(expense.montant, enterprise?.devise)}
                      </div>
                      <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
                        <MoreVertical size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Labor Debt Details */}
        <div className="space-y-6">
          <Card className="border-border overflow-hidden" padding="none">
             <div className="border-b border-border p-4 sm:p-6 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-medium text-foreground">
                    Impayés
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Soldes par ouvrier
                  </p>
                </div>
                <Link href="/dashboard/budget/personnel">
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                      <ArrowRight size={16} />
                   </Button>
                </Link>
             </div>

             <div>
                {isLoading ? (
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : !laborSummary || laborSummary.workers.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    Tout est réglé.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {laborSummary.workers.filter((w: any) => w.remaining > 0).map((worker: any) => (
                      <div key={worker.id} className="flex items-center justify-between p-4">
                         <div className="min-w-0">
                            <p className="text-size-sm font-medium text-foreground truncate">{worker.nom_complet}</p>
                            <p className="text-xs text-muted-foreground">{worker.daysPresent} jours présents</p>
                         </div>
                         <div className="text-right">
                            <p className="font-tabular text-size-sm font-medium text-destructive">
                              {formatCurrency(worker.remaining, enterprise?.devise)}
                            </p>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>

             <div className="border-t border-border bg-muted/20 p-4">
                <div className="flex justify-between items-center">
                   <span className="text-xs text-muted-foreground">Dette totale personnel</span>
                   <span className="font-tabular text-sm font-medium text-destructive">{formatCurrency(totalLaborDebt, enterprise?.devise)}</span>
                </div>
             </div>
          </Card>

          <Card className="border-border p-6">
             <p className="text-xs text-muted-foreground mb-1">Enveloppe budgétaire</p>
             <p className="font-tabular text-size-2xl font-medium text-foreground mb-4">
               {formatCurrency(budgetTotal, enterprise?.devise)}
             </p>
             <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                   <span>Consommation réelle</span>
                   <span className="font-tabular">{margin ? (100 - Number(margin)).toFixed(1) : 0}%</span>
                </div>
                <div className="h-1 w-full bg-muted overflow-hidden">
                   <div
                    className="h-full bg-primary transition-all duration-1000"
                    style={{ width: `${Math.min(100, margin ? 100 - Number(margin) : 0)}%` }}
                   />
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
