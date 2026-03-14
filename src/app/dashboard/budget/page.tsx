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
  Users,
  Banknote,
  ArrowRight,
  HandCoins,
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
  const laborSummary = data?.laborSummary;

  const filteredExpenses =
    !selectedProjectId || selectedProjectId === 'all'
      ? expenses
      : expenses.filter((e) => e.chantier_id === selectedProjectId);

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.montant, 0);
  const totalLaborDebt = laborSummary?.totalDebt || 0;
  const totalFinancialPressure = totalExpenses + totalLaborDebt;

  const selectedProjectObj = projects.find((p) => p.id === selectedProjectId);
  const budgetTotal = selectedProjectObj?.budget_total || 0;
  const budgetRemaining = Math.max(0, budgetTotal - totalFinancialPressure);

  // Margin calculation accounts for both paid expenses and outstanding labor debt
  const margin =
    budgetTotal > 0
      ? (((budgetTotal - totalFinancialPressure) / budgetTotal) * 100).toFixed(1)
      : null;

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl uppercase font-black">Finances</h1>
          <p className="hidden text-size-xs font-medium text-muted-foreground sm:block uppercase tracking-wider">
            Suivi des dépenses et rentabilité des chantiers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard/budget/personnel">
            <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-black uppercase text-[10px] tracking-widest h-9 px-4 rounded-xl">
               <Users size={14} className="mr-2" />
               Paiements Personnel
            </Button>
          </Link>
          <ExportModal />
          <CreateExpenseModal onExpenseCreated={refetch} />
        </div>
      </div>

      {/* Alerte budget dépassé */}
      {selectedProjectObj && totalFinancialPressure > budgetTotal && budgetTotal > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive text-white shadow-lg shadow-destructive/20">
            <AlertCircle size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-destructive">Risque budgétaire élevé</p>
            <p className="text-[10px] font-bold text-destructive/80 uppercase">
              Dépassement de {formatCurrency(totalFinancialPressure - budgetTotal, enterprise?.devise)}
              (Dépenses + Dettes Main d'œuvre)
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-fluid-md">
        <Card className="group relative overflow-hidden border-border p-4 sm:p-6 rounded-2xl border-l-8 border-l-indigo-600">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-600">
              <Wallet size={18} />
            </div>
            <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
              Budget Engagé
            </span>
          </div>
          <p className="text-size-2xl font-black tracking-tight text-foreground">
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              formatCurrency(totalFinancialPressure, enterprise?.devise)
            )}
          </p>
          <p className="mt-2 text-[9px] font-black tracking-widest text-muted-foreground uppercase italic">Dépenses + Dettes MO</p>
        </Card>

        <Card className="group relative overflow-hidden border-border p-4 sm:p-6 rounded-2xl border-l-8 border-l-rose-600">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-rose-500/10 p-2 text-rose-600">
              <Banknote size={18} />
            </div>
            <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
              Dettes à Payer
            </span>
          </div>
          <p className="text-size-2xl font-black tracking-tight text-rose-600">
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              formatCurrency(totalLaborDebt, enterprise?.devise)
            )}
          </p>
          <p className="mt-2 text-[9px] font-black tracking-widest text-muted-foreground uppercase italic">Salaires non réglés</p>
        </Card>

        <Card className="group relative overflow-hidden border-border p-4 sm:p-6 rounded-2xl border-l-8 border-l-emerald-600">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600">
              <HandCoins size={18} />
            </div>
            <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
              Budget Restant
            </span>
          </div>
          <p className="text-size-2xl font-black tracking-tight text-emerald-600">
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              formatCurrency(budgetRemaining, enterprise?.devise)
            )}
          </p>
          <p className="mt-2 text-[9px] font-black tracking-widest text-muted-foreground uppercase italic">Marge de manoeuvre</p>
        </Card>

        <Card className="group relative overflow-hidden border-border p-4 sm:p-6 rounded-2xl border-l-8 border-l-primary">
          <div className="mb-4 flex items-center gap-3">
            <div className={cn(
              "rounded-xl p-2 shadow-sm transition-colors",
              margin && Number(margin) > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
            )}>
              {margin && Number(margin) > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
            <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
              Rentabilité
            </span>
          </div>
          <p className={cn(
            "text-size-2xl font-black tracking-tight",
            margin && Number(margin) > 0 ? "text-emerald-600" : "text-destructive"
          )}>
            {isLoading ? <Skeleton className="h-8 w-20" /> : margin ? `${margin}%` : '--'}
          </p>
          <p className="mt-2 text-[9px] font-black tracking-widest text-muted-foreground uppercase italic">Marge nette estimée</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Transaction Ledger */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-premium overflow-hidden border-border rounded-2xl" padding="none">
            <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/30 p-4 sm:p-6 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-border bg-card p-2 shadow-sm">
                  <Calendar size={18} className="text-primary" />
                </div>
                <h2 className="text-size-lg font-black tracking-tight text-foreground uppercase">
                  Grand Livre
                </h2>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Dépenses enregistrées
              </div>
            </div>

            {isLoading && expenses.length === 0 ? (
              <div className="divide-y divide-border">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 sm:p-6">
                    <Skeleton className="h-10 w-10 rounded-xl" />
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
                <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-background shadow-premium border border-border">
                  <Calculator size={40} className="text-primary/20" />
                  <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-premium animate-bounce">
                    <Plus size={16} />
                  </div>
                </div>
                <h2 className="mb-2 text-size-xl font-black tracking-tight text-foreground uppercase">
                  Historique vide
                </h2>
                <p className="mx-auto mb-10 max-w-sm text-size-sm font-bold text-muted-foreground italic uppercase">
                  Aucune transaction n'a été enregistrée pour ce chantier.
                </p>
                <CreateExpenseModal onExpenseCreated={refetch}>
                  <Button className="h-11 rounded-xl px-8 font-black uppercase tracking-widest shadow-premium transition-all hover:scale-105 active:scale-95 bg-indigo-600">
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
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 transition-transform group-hover:scale-110 shadow-sm',
                        expense.categorie === 'materiaux' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                      )}>
                        {expense.categorie === 'materiaux' ? <Package size={18} /> : <Calculator size={18} />}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-size-sm font-black text-foreground group-hover:text-primary uppercase tracking-tight">
                          {expense.libelle}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                          <span>{new Date(expense.date_operation).toLocaleDateString()}</span>
                          <span className="text-muted-foreground/30">•</span>
                          <span className="text-primary">{expense.categorie.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-right">
                        <div className="text-size-sm font-black text-rose-600 sm:text-size-base">
                          - {formatCurrency(expense.montant, enterprise?.devise)}
                        </div>
                      </div>
                      <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Labor Debt Details */}
        <div className="space-y-6">
          <Card className="shadow-premium border-border rounded-2xl overflow-hidden" padding="none">
             <div className="border-b border-border bg-rose-500/5 p-4 sm:p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-rose-500 text-white p-2 shadow-lg shadow-rose-200">
                    <Users size={18} />
                  </div>
                  <div>
                    <h2 className="text-size-lg font-black tracking-tight text-foreground uppercase">
                      Soldes Ouvriers
                    </h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Reste à payer
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/budget/personnel">
                   <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-rose-100 text-rose-600">
                      <ArrowRight size={16} />
                   </Button>
                </Link>
             </div>

             <div className="p-2">
                {isLoading ? (
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                ) : !laborSummary || laborSummary.workers.length === 0 ? (
                  <div className="py-12 text-center">
                    <HardHat size={32} className="mx-auto mb-2 text-muted-foreground/20" />
                    <p className="text-[10px] font-black text-muted-foreground uppercase italic">Aucune dette MO</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {laborSummary.workers.map((worker: any) => (
                      <div key={worker.id} className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-muted/50 border border-transparent hover:border-border">
                         <div className="min-w-0">
                            <p className="text-[11px] font-black text-foreground uppercase truncate">{worker.nom_complet}</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">{worker.daysPresent} jours présents</p>
                         </div>
                         <div className="text-right">
                            <p className={cn(
                              "text-xs font-black",
                              worker.remaining > 0 ? "text-rose-600" : "text-emerald-600"
                            )}>
                              {formatCurrency(worker.remaining, enterprise?.devise)}
                            </p>
                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">Solde restant</p>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>

             <div className="border-t border-border bg-muted/20 p-4">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Dû</span>
                   <span className="text-sm font-black text-rose-600">{formatCurrency(totalLaborDebt, enterprise?.devise)}</span>
                </div>
             </div>
          </Card>

          <Card className="bg-indigo-600 text-white border-none p-6 rounded-2xl shadow-xl shadow-indigo-100">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Budget Total</h3>
             <p className="text-2xl font-black mb-4">
               {formatCurrency(budgetTotal, enterprise?.devise)}
             </p>
             <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                   <span>Budget Engagé</span>
                   <span>{margin ? (100 - Number(margin)).toFixed(1) : 0}%</span>
                </div>
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                   <div
                    className="h-full bg-white transition-all duration-1000"
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
