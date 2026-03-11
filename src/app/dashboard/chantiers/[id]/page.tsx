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
  ChevronLeft
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/lib/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { enterprise } = useApp();
  const [project, setProject] = useState<any>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'workforce' | 'inventory' | 'finances'>('overview');

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
    if (wRes.workers) setWorkers(wRes.workers.filter((w: any) => w.chantier_ids?.includes(id)));
    if (sRes.materials) setMaterials(sRes.materials);
    if (bRes.expenses) setExpenses(bRes.expenses.filter((e: any) => e.chantier_id === id));
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
  const margin = project.budget_total > 0
    ? (((project.budget_total - totalExpenses) / project.budget_total) * 100).toFixed(1)
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
            <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl">{project.nom}</h1>
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
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Card className="p-3 border-l-4 border-l-primary">
              <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Effectif</p>
              <div className="flex items-baseline gap-2">
                <span className="text-size-lg font-semibold">{workers.length}</span>
                <span className="text-[8px] font-medium text-emerald-600 flex items-center gap-0.5">
                   {todayAttendance.length} Présents
                </span>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-amber-500">
              <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Stock</p>
              <div className="flex items-baseline gap-2">
                <span className="text-size-lg font-semibold">
                  {materials.filter((m) => (m.stock_actuel || 0) <= m.seuil_alerte).length}
                </span>
                <span className="text-[8px] font-medium text-amber-600">Alertes</span>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-emerald-500">
              <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Dépensé</p>
              <span className="text-size-lg font-semibold truncate block">
                {formatCurrency(totalExpenses, enterprise?.devise)}
              </span>
            </Card>
            <Card className="p-3 border-l-4 border-l-secondary">
              <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Marge</p>
              <span className={cn(
                "text-size-lg font-semibold",
                Number(margin) > 0 ? "text-emerald-600" : "text-destructive"
              )}>
                {margin ? `${margin}%` : '--'}
              </span>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-fluid-md">
            {/* Progress */}
            <Card className="p-4 sm:p-6 lg:col-span-2 border-border">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-size-base font-semibold tracking-tight">Avancement</h3>
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Global chantier</p>
                </div>
                <div className="text-size-xl font-semibold text-primary">{project.avancement_pct || 0}%</div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-1000"
                  style={{ width: `${project.avancement_pct || 0}%` }}
                />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-4">
                <div>
                  <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest">Fin</p>
                  <p className="text-[10px] font-semibold">{project.date_fin_prevue ? formatDate(project.date_fin_prevue) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest">Durée</p>
                  <p className="text-[10px] font-semibold">-- j</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest">État</p>
                  <p className="text-[10px] font-semibold text-emerald-600">Ok</p>
                </div>
              </div>
            </Card>

            {/* Daily Log Mini */}
            <Card className="overflow-hidden border-border" padding="none">
              <div className="border-b border-border bg-muted/30 p-3">
                <h3 className="text-size-xs font-semibold uppercase tracking-widest text-muted-foreground">Présences Jour</h3>
              </div>
              <div className="divide-y divide-border max-h-[240px] overflow-y-auto">
                {todayAttendance.length === 0 ? (
                  <div className="p-6 text-center text-[10px] text-muted-foreground italic">Aucun log.</div>
                ) : (
                  todayAttendance.slice(0, 5).map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-bold border border-emerald-500/20">
                          {workers.find((w) => w.id === log.ouvrier_id)?.nom_complet.charAt(0)}
                        </div>
                        <span className="truncate text-[11px] font-medium text-foreground max-w-[100px]">
                          {workers.find((w) => w.id === log.ouvrier_id)?.nom_complet}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground">{log.heure_arrivee}</span>
                    </div>
                  ))
                )}
              </div>
              <Button variant="ghost" size="sm" className="w-full h-8 text-[9px] font-semibold uppercase tracking-widest rounded-none border-t border-border">
                Voir tout
              </Button>
            </Card>
          </div>
        </div>
      )}

      {activeTab !== 'overview' && (
        <Card className="border-2 border-dashed border-border bg-muted/30 py-12 text-center">
          <div className="mb-4 inline-flex rounded-md bg-background p-4 text-muted-foreground/30">
            <Plus size={24} />
          </div>
          <h2 className="text-size-sm font-semibold tracking-tight text-foreground uppercase">Module {activeTab}</h2>
          <p className="text-[10px] font-medium text-muted-foreground mt-1">Intégration en cours.</p>
        </Card>
      )}
    </div>
  );
}
