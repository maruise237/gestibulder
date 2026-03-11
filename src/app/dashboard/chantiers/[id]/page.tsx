'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { getProjectById } from '@/lib/server/project.actions';
import { getWorkers } from '@/lib/server/worker.actions';
import { getMaterials } from '@/lib/server/stock.actions';
import { getBudgetData } from '@/lib/server/dashboard.actions';
import { getAttendance } from '@/lib/server/attendance.actions';
import {
  MapPin,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  Users,
  Package,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calculator,
  ArrowDownRight,
  MoreVertical,
  Search
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/lib/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Worker } from '@/types/worker';
import { Material } from '@/types/stock';
import { Expense } from '@/types/expense';
import { Project } from '@/types/project';
import { Attendance } from '@/types/attendance';

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { enterprise } = useApp();
  const [project, setProject] = useState<Project | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'workforce' | 'inventory' | 'finances'>('overview');

  const formatMetier = (worker: Worker) => {
    return worker.metier === 'autre' ? worker.metier_custom : worker.metier;
  };

  const getTaux = (worker: Worker) => {
    switch (worker.type_paiement) {
      case 'journalier':
        return worker.taux_journalier;
      case 'hebdomadaire':
        return worker.salaire_hebdo;
      case 'mensuel':
        return worker.salaire_mensuel;
      default:
        return 0;
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [pRes, wRes, sRes, bRes, aRes] = await Promise.all([
      getProjectById(id),
      getWorkers(1, 1000),
      getMaterials(id),
      getBudgetData(),
      getAttendance(id, new Date().toISOString().split('T')[0])
    ]);

    if (pRes.project) setProject(pRes.project);
    if (wRes.workers) setWorkers(wRes.workers.filter((w: Worker) => w.chantier_ids?.includes(id)));
    if (sRes.materials) setMaterials(sRes.materials);
    if (bRes.expenses) setExpenses(bRes.expenses.filter((e: Expense) => e.chantier_id === id));
    if (aRes.logs) setTodayAttendance(aRes.logs);
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading && !project) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) return <div className="p-8 text-center">Projet non trouvé</div>;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.montant, 0);
  const marginValue = project.budget_total - totalExpenses;
  const marginPct = project.budget_total > 0
    ? ((marginValue / project.budget_total) * 100).toFixed(1)
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/chantiers" className="flex w-fit items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft size={14} />
          Retour
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[8px] uppercase tracking-widest font-semibold h-4 px-1.5 border-border">ID: {project.id.slice(0, 6)}</Badge>
              <Badge variant="secondary" className="text-[8px] uppercase tracking-widest font-semibold h-4 px-1.5">{project.statut.replace('_', ' ')}</Badge>
            </div>
            <h1 className="text-size-2xl font-black tracking-tight text-foreground sm:text-size-3xl uppercase">{project.nom}</h1>
            <div className="flex flex-wrap items-center gap-3 text-size-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin size={12} className="text-primary" />
                {project.adresse || 'Sans adresse'}
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={12} className="text-primary" />
                Démarré le {new Date(project.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 px-2 text-[10px] uppercase font-semibold">
              <Clock size={14} className="mr-1.5" /> Historique
            </Button>
            <Button size="sm" className="h-8 px-2 text-[10px] uppercase font-semibold">
              <Plus size={14} className="mr-1.5" /> Activité
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-md border border-border bg-muted/30 p-1 no-scrollbar">
        {(['overview', 'workforce', 'inventory', 'finances'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 rounded-sm px-3 py-1.5 text-[9px] font-semibold uppercase tracking-widest transition-all whitespace-nowrap',
              activeTab === tab
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/50'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <Card className="p-3 border-l-8 border-l-indigo-600 rounded-2xl">
                <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Effectif</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-size-lg font-black">{workers.length}</span>
                  <span className="text-[8px] font-medium text-emerald-600 flex items-center gap-0.5">
                     {todayAttendance.length} Présents
                  </span>
                </div>
              </Card>
              <Card className="p-3 border-l-8 border-l-amber-500 rounded-2xl">
                <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Stock</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-size-lg font-black">
                    {materials.filter((m) => (m.stock_actuel || 0) <= m.seuil_alerte).length}
                  </span>
                  <span className="text-[8px] font-medium text-amber-600">Alertes</span>
                </div>
              </Card>
              <Card className="p-3 border-l-8 border-l-emerald-500 rounded-2xl">
                <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Dépensé</p>
                <span className="text-size-lg font-black truncate block">
                  {formatCurrency(totalExpenses, enterprise?.devise)}
                </span>
              </Card>
              <Card className="p-3 border-l-8 border-l-indigo-600 rounded-2xl">
                <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Marge</p>
                <span className={cn(
                  "text-size-lg font-black",
                  Number(marginPct) > 0 ? "text-emerald-600" : "text-destructive"
                )}>
                  {marginPct ? `${marginPct}%` : '--'}
                </span>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-fluid-md">
              {/* Progress */}
              <Card className="p-4 sm:p-6 lg:col-span-2 border-border rounded-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-size-base font-black tracking-tight uppercase">Avancement</h3>
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Global chantier</p>
                  </div>
                  <div className="text-size-xl font-black text-primary">{project.avancement_pct || 0}%</div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-1000"
                    style={{ width: `${project.avancement_pct || 0}%` }}
                  />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-4">
                  <div>
                    <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest">Fin</p>
                    <p className="text-[10px] font-black uppercase">{project.date_fin_prevue ? formatDate(project.date_fin_prevue) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest">Durée</p>
                    <p className="text-[10px] font-black uppercase">-- j</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest">État</p>
                    <p className="text-[10px] font-black text-emerald-600 uppercase">Ok</p>
                  </div>
                </div>
              </Card>

              {/* Daily Log Mini */}
              <Card className="overflow-hidden border-border rounded-2xl" padding="none">
                <div className="border-b border-border bg-muted/30 p-3">
                  <h3 className="text-size-xs font-black uppercase tracking-widest text-muted-foreground">Présences Jour</h3>
                </div>
                <div className="divide-y divide-border max-h-[240px] overflow-y-auto">
                  {todayAttendance.length === 0 ? (
                    <div className="p-6 text-center text-[10px] text-muted-foreground italic">Aucun log.</div>
                  ) : (
                    todayAttendance.slice(0, 5).map((log, i) => (
                      <div key={i} className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600/10 text-indigo-600 text-[10px] font-black border border-indigo-600/20">
                            {workers.find((w) => w.id === log.ouvrier_id)?.nom_complet.charAt(0)}
                          </div>
                          <span className="truncate text-[11px] font-black text-foreground max-w-[100px] uppercase">
                            {workers.find((w) => w.id === log.ouvrier_id)?.nom_complet}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-muted-foreground">{log.heure_arrivee}</span>
                      </div>
                    ))
                  )}
                </div>
                <Button variant="ghost" size="sm" className="w-full h-8 text-[9px] font-black uppercase tracking-widest rounded-none border-t border-border">
                  Voir tout
                </Button>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'workforce' && (
          <Card className="shadow-premium overflow-hidden border-border rounded-2xl border-l-8 border-l-indigo-600" padding="none">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                      Ouvrier
                    </th>
                    <th className="hidden px-4 py-3 text-[10px] font-black tracking-widest text-muted-foreground uppercase sm:table-cell">
                      Métier
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                      Rémunération
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {workers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-[10px] font-medium text-muted-foreground uppercase italic">
                        Aucun ouvrier sur ce chantier.
                      </td>
                    </tr>
                  ) : (
                    workers.map((worker) => (
                      <tr
                        key={worker.id}
                        className="group transition-all duration-200 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-[10px] font-black text-foreground">
                              {worker.nom_complet.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="truncate text-size-xs font-black text-foreground sm:text-size-sm uppercase">
                                {worker.nom_complet}
                              </span>
                              <span className="truncate text-[10px] font-semibold text-muted-foreground sm:hidden uppercase">
                                {formatMetier(worker)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 sm:table-cell">
                          <div className="flex flex-col">
                            <span className="text-size-xs font-black text-foreground uppercase">
                              {formatMetier(worker)}
                            </span>
                            <span className="text-[9px] font-semibold text-muted-foreground uppercase">
                              {worker.unite_production}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-size-xs font-black text-foreground sm:text-size-sm uppercase">
                              {formatCurrency(getTaux(worker) || 0, enterprise?.devise)}
                            </span>
                            <span className="text-[9px] font-semibold text-indigo-600 uppercase">
                              {worker.type_paiement}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <span
                              className={cn(
                                'rounded-full border px-2 py-0.5 text-[8px] font-black tracking-widest uppercase sm:text-[9px]',
                                worker.actif
                                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700'
                                  : 'border-destructive/20 bg-destructive/10 text-destructive'
                              )}
                            >
                              {worker.actif ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'inventory' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {materials.length === 0 ? (
              <Card className="col-span-full border-2 border-dashed border-border bg-muted/30 py-12 text-center rounded-2xl">
                <div className="mb-4 inline-flex rounded-xl bg-background p-4 text-muted-foreground shadow-sm">
                  <Package size={32} strokeWidth={1.5} />
                </div>
                <h2 className="mb-1 text-size-lg font-black tracking-tight text-foreground uppercase">
                  Aucun matériau
                </h2>
                <p className="mx-auto text-[10px] font-medium text-muted-foreground uppercase">
                  Aucun matériau enregistré pour ce chantier.
                </p>
              </Card>
            ) : (
              materials.map((mat) => {
                const stock = mat.stock_actuel || 0;
                const isLow = stock <= mat.seuil_alerte && stock > 0;
                const isOut = stock <= 0;

                return (
                  <Card
                    key={mat.id}
                    className="group flex flex-col overflow-hidden border-border p-0 rounded-2xl"
                    padding="none"
                  >
                    <div className="p-4 sm:p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div className={cn(
                          "rounded-md p-2",
                          isOut ? "bg-destructive/10 text-destructive" : isLow ? "bg-amber-500/10 text-amber-600" : "bg-indigo-600/10 text-indigo-600"
                        )}>
                          <Package size={18} />
                        </div>
                        <div className="flex items-center gap-2">
                           {isOut ? (
                             <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[8px] font-black tracking-widest text-destructive uppercase">Rupture</span>
                           ) : isLow ? (
                             <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[8px] font-black tracking-widest text-amber-600 uppercase">Critique</span>
                           ) : null}
                        </div>
                      </div>

                      <h3 className="truncate text-size-lg font-black tracking-tight text-foreground group-hover:text-indigo-600 uppercase">
                        {mat.nom}
                      </h3>
                      <p className="mt-1 flex items-center gap-1.5 text-[9px] font-semibold text-muted-foreground uppercase">
                        Seuil: {mat.seuil_alerte} {mat.unite}
                      </p>

                      <div className="my-6 flex items-center justify-between rounded-lg border border-border bg-muted/20 p-4">
                        <div className="flex flex-col">
                          <span className={cn(
                            "text-size-3xl font-black tracking-tight",
                            isOut ? "text-destructive" : isLow ? "text-amber-600" : "text-foreground"
                          )}>
                            {stock}
                          </span>
                          <span className="text-[9px] font-black text-muted-foreground uppercase">{mat.unite}</span>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between">
                         <span className="text-[8px] font-semibold text-muted-foreground uppercase">
                           Maj {new Date(mat.created_at).toLocaleDateString()}
                         </span>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'finances' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="group relative overflow-hidden border-border p-4 sm:p-6 rounded-2xl border-l-8 border-l-indigo-600">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-md bg-indigo-600/10 p-2 text-indigo-600">
                    <Wallet size={18} />
                  </div>
                  <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                    Total Dépenses
                  </span>
                </div>
                <p className="text-size-2xl font-black tracking-tight text-foreground">
                  {formatCurrency(totalExpenses, enterprise?.devise)}
                </p>
                <div className="mt-2 flex items-center gap-1 text-emerald-600">
                  <ArrowDownRight size={14} />
                  <span className="text-[9px] font-black tracking-widest uppercase">
                    Actualisé
                  </span>
                </div>
              </Card>

              <Card className="group relative overflow-hidden border-border p-4 sm:p-6 rounded-2xl border-l-8 border-l-indigo-600">
                <div className="mb-4 flex items-center gap-3">
                  <div className={cn(
                    "rounded-md p-2",
                    marginValue > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
                  )}>
                    {marginValue > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                    Marge (Currency)
                  </span>
                </div>
                <p className={cn(
                  "text-size-2xl font-black tracking-tight",
                  marginValue > 0 ? "text-emerald-600" : "text-destructive"
                )}>
                  {formatCurrency(marginValue, enterprise?.devise)}
                </p>
                <p className="mt-2 text-[9px] font-black tracking-widest text-muted-foreground uppercase">
                  {marginPct ? `${marginPct}% de rentabilité` : 'Rentabilité non calculable'}
                </p>
              </Card>
            </div>

            <Card className="shadow-premium overflow-hidden border-border rounded-2xl" padding="none">
              <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/30 p-4 sm:p-6 md:flex-row md:items-center">
                <div className="flex items-center gap-3">
                  <div className="rounded-md border border-border bg-background p-2">
                    <Calculator size={18} className="text-indigo-600" />
                  </div>
                  <h2 className="text-size-lg font-black tracking-tight text-foreground uppercase">
                    Grand Livre
                  </h2>
                </div>
              </div>

              {expenses.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Calculator size={32} className="mx-auto mb-2 opacity-10" />
                  <p className="text-[10px] font-black uppercase italic">Aucune transaction enregistrée.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="group flex items-center justify-between p-4 transition-all duration-200 hover:bg-muted/30 sm:p-6"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-transform group-hover:scale-110',
                          expense.categorie === 'materiaux' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-indigo-600/10 text-indigo-600 border-indigo-600/20'
                        )}>
                          {expense.categorie === 'materiaux' ? <Package size={18} /> : <Calculator size={18} />}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-size-sm font-black text-foreground group-hover:text-indigo-600 uppercase">
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
                          <div className="text-size-sm font-black text-destructive sm:text-size-base uppercase">
                            - {formatCurrency(expense.montant, enterprise?.devise)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
