'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { getProjectById, updateProjectStatus, updateProjectProgress, getProjectActivity } from '@/lib/server/project.actions';
import { getWorkers } from '@/lib/server/worker.actions';
import { getMaterials } from '@/lib/server/stock.actions';
import { getBudgetData } from '@/lib/server/dashboard.actions';
import { getAttendance } from '@/lib/server/attendance.actions';
import {
  MapPin,
  Calendar,
  Clock,
  Plus,
  Loader2,
  ChevronLeft,
  Users,
  Package,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calculator,
  ArrowDownRight,
  Search,
  HardHat,
  History,
  Activity as ActivityIcon
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/lib/context/app-context';
import Link from 'next/link';
import { Worker } from '@/types/worker';
import { Material } from '@/types/stock';
import { Expense } from '@/types/expense';
import { Project, ProjectStatus } from '@/types/project';
import { Attendance } from '@/types/attendance';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { enterprise } = useApp();
  const [project, setProject] = useState<Project | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'workforce' | 'inventory' | 'finances'>('overview');
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  const formatMetier = (worker: Worker) => {
    return worker.metier === 'autre' ? worker.metier_custom : worker.metier;
  };

  const getTaux = (worker: Worker) => {
    switch (worker.type_paiement) {
      case 'journalier':
        return worker.taux_journalier || 0;
      case 'hebdomadaire':
        return worker.salaire_hebdo || 0;
      case 'mensuel':
        return worker.salaire_mensuel || 0;
      default:
        return 0;
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [pRes, wRes, sRes, bRes, aRes, actRes] = await Promise.all([
      getProjectById(id),
      getWorkers(1, 1000),
      getMaterials(id),
      getBudgetData(),
      getAttendance(id, new Date().toISOString().split('T')[0]),
      getProjectActivity(id)
    ]);

    if (pRes.project) setProject(pRes.project as Project);
    if (wRes.workers) setWorkers(wRes.workers.filter((w: Worker) => w.chantier_ids?.includes(id)));
    if (sRes.materials) setMaterials(sRes.materials);
    if (bRes.expenses) setExpenses(bRes.expenses.filter((e: Expense) => e.chantier_id === id));
    if (aRes.logs) setTodayAttendance(aRes.logs);
    if (actRes.activities) setActivities(actRes.activities);
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateStatus = async (status: ProjectStatus | null) => {
    if (!status) return;
    setIsUpdating(true);
    const res = await updateProjectStatus(id, status);
    if (res.success) {
      setProject(prev => prev ? { ...prev, statut: status } : null);
    }
    setIsUpdating(false);
  };

  const handleUpdateProgress = async (progress: number) => {
    setIsUpdating(true);
    const res = await updateProjectProgress(id, progress);
    if (res.success) {
      setProject(prev => prev ? { ...prev, avancement_pct: progress } : null);
    }
    setIsUpdating(false);
  };

  if (isLoading && !project) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) return <div className="p-8 text-center uppercase font-black">Projet non trouvé</div>;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.montant, 0);
  const marginValue = project.budget_total - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/chantiers"
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
      >
        <ChevronLeft size={14} />
        Retour aux chantiers
      </Link>

      {/* Header Profile */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-premium">
            <HardHat size={32} />
          </div>
          <div className="space-y-1">
            <h1 className="text-size-3xl font-black tracking-tight text-foreground uppercase">
              {project.nom}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {project.adresse || 'Non spécifié'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={12} /> Fin : {project.date_fin_prevue ? formatDate(project.date_fin_prevue) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
           <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-xl border border-border">
             <Select
               value={project.statut}
               onValueChange={handleUpdateStatus}
               disabled={isUpdating}
             >
               <SelectTrigger className="h-8 w-[140px] border-none bg-transparent text-[10px] font-black uppercase tracking-widest shadow-none">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="preparation">En attente</SelectItem>
                 <SelectItem value="en_cours">En cours</SelectItem>
                 <SelectItem value="termine">Terminé</SelectItem>
                 <SelectItem value="pause">Suspendu</SelectItem>
               </SelectContent>
             </Select>

             <div className="h-4 w-[1px] bg-border mx-1" />

             <div className="flex items-center gap-2 px-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progrès:</span>
               <div className="flex items-center gap-1">
                 <Input
                   type="number"
                   min="0"
                   max="100"
                   defaultValue={project.avancement_pct || 0}
                   onBlur={(e) => handleUpdateProgress(Number(e.target.value))}
                   disabled={isUpdating}
                   className="h-7 w-14 border-border bg-background px-1 text-center text-[11px] font-black"
                 />
                 <span className="text-[11px] font-black">%</span>
               </div>
             </div>
           </div>

           <Button variant="outline" size="sm" className="h-8 px-2 text-[10px] uppercase font-semibold" onClick={() => setActivityModalOpen(true)}>
             <History size={14} className="mr-1.5" /> Historique
           </Button>
           <Button size="sm" className="h-8 px-2 text-[10px] uppercase font-semibold" onClick={() => setActivityModalOpen(true)}>
             <ActivityIcon size={14} className="mr-1.5" /> Activité
           </Button>
        </div>
      </div>

      {/* Activity Modal */}
      <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none">
          <DialogHeader className="bg-indigo-600 p-6 text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <History size={20} /> Journal d'Activité
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-6">
            {activities.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground italic uppercase text-[10px] font-black">
                Aucune activité enregistrée.
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
                {activities.map((act) => (
                  <div key={act.id} className="relative pl-10">
                    <div className={cn(
                      "absolute left-0 top-0 h-8 w-8 rounded-full flex items-center justify-center border-2 border-background shadow-sm",
                      act.type === 'expense' ? "bg-rose-500 text-white" :
                      act.subType === 'entree' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                    )}>
                      {act.type === 'expense' ? <Wallet size={14} /> : <Package size={14} />}
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-foreground leading-tight">{act.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={cn(
                          "text-size-sm font-black",
                          act.type === 'expense' ? "text-rose-600" :
                          act.subType === 'entree' ? "text-emerald-600" : "text-amber-600"
                        )}>
                          {act.type === 'expense' ? `- ${formatCurrency(act.amount, enterprise?.devise)}` :
                           `${act.subType === 'entree' ? '+' : '-'}${act.amount} ${act.unit}`}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">
                          • {new Date(act.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted/30 p-1">
        {[
          { id: 'overview', label: 'Vue d\'ensemble' },
          { id: 'workforce', label: 'Main d\'œuvre' },
          { id: 'inventory', label: 'Stocks' },
          { id: 'finances', label: 'Finances' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "whitespace-nowrap rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === tab.id
                ? "bg-white text-indigo-600 shadow-sm border border-border"
                : "text-muted-foreground hover:bg-white/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="shadow-premium border-border rounded-2xl p-6">
                <div className="mb-6 flex items-center justify-between">
                   <h2 className="text-size-lg font-black tracking-tight text-foreground uppercase">Statut d'Avancement</h2>
                   <span className="text-size-2xl font-black text-indigo-600">{project.avancement_pct || 0}%</span>
                </div>
                <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
                   <div
                     className="h-full bg-indigo-600 transition-all duration-1000 ease-out"
                     style={{ width: `${project.avancement_pct || 0}%` }}
                   />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Effectif total</p>
                    <p className="text-size-xl font-black text-foreground">{workers.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Présents (jour)</p>
                    <p className="text-size-xl font-black text-emerald-600">
                      {todayAttendance.filter(a => a.statut === 'present').length}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Alertes stock</p>
                    <p className="text-size-xl font-black text-amber-600">
                      {materials.filter(m => (m.stock_actuel || 0) <= m.seuil_alerte).length}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Budget consommé</p>
                    <p className="text-size-xl font-black text-foreground">
                       {project.budget_total > 0 ? Math.round((totalExpenses / project.budget_total) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                 <Card className="border-border p-6 rounded-2xl">
                   <div className="mb-4 flex items-center justify-between">
                      <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600">
                        <Users size={20} />
                      </div>
                      <Link href="/dashboard/pointage" className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Pointage</Link>
                   </div>
                   <h3 className="text-size-sm font-black text-muted-foreground uppercase tracking-widest">Main d'œuvre</h3>
                   <p className="mt-1 text-size-xl font-black text-foreground">{workers.length} ouvriers</p>
                 </Card>

                 <Card className="border-border p-6 rounded-2xl">
                    <div className="mb-4 flex items-center justify-between">
                       <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600">
                         <Package size={20} />
                       </div>
                       <Link href="/dashboard/stocks" className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Stocks</Link>
                    </div>
                    <h3 className="text-size-sm font-black text-muted-foreground uppercase tracking-widest">Matériaux</h3>
                    <p className="mt-1 text-size-xl font-black text-foreground">{materials.length} références</p>
                 </Card>
              </div>
            </div>

            <div className="space-y-6">
               <Card className="border-border p-6 rounded-2xl border-l-8 border-l-indigo-600">
                 <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-600/10 p-2 text-indigo-600">
                      <Wallet size={18} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Budget Total</span>
                 </div>
                 <p className="text-size-2xl font-black text-foreground">{formatCurrency(project.budget_total, enterprise?.devise)}</p>
               </Card>

               <Card className="border-border p-6 rounded-2xl border-l-8 border-l-rose-500">
                  <div className="mb-4 flex items-center gap-3">
                     <div className="rounded-lg bg-rose-500/10 p-2 text-rose-600">
                       <TrendingDown size={18} />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dépenses réelles</span>
                  </div>
                  <p className="text-size-2xl font-black text-foreground">{formatCurrency(totalExpenses, enterprise?.devise)}</p>
               </Card>

               <Card className={cn(
                 "border-border p-6 rounded-2xl border-l-8",
                 marginValue > 0 ? "border-l-emerald-500" : "border-l-rose-500"
               )}>
                  <div className="mb-4 flex items-center gap-3">
                     <div className={cn(
                       "rounded-lg p-2",
                       marginValue > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                     )}>
                       {marginValue > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Marge actuelle</span>
                  </div>
                  <p className={cn(
                    "text-size-2xl font-black",
                    marginValue > 0 ? "text-emerald-600" : "text-rose-600"
                  )}>{formatCurrency(marginValue, enterprise?.devise)}</p>
               </Card>
            </div>
          </div>
        )}

        {activeTab === 'workforce' && (
          <Card className="shadow-premium overflow-hidden border-border rounded-2xl" padding="none">
            <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/30 p-4 sm:p-6 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-md border border-border bg-background p-2">
                  <Users size={18} className="text-indigo-600" />
                </div>
                <h2 className="text-size-lg font-black tracking-tight text-foreground uppercase">
                  Ouvriers affectés
                </h2>
              </div>
              <div className="group relative">
                <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="h-9 w-full rounded-md border border-border bg-background pl-9 text-xs font-medium outline-none focus:border-indigo-600 sm:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nom complet</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Métier</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Paiement</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Taux</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {workers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground italic uppercase text-[10px] font-black">
                         Aucun ouvrier affecté.
                      </td>
                    </tr>
                  ) : (
                    workers.map((worker) => (
                      <tr key={worker.id} className="group transition-colors hover:bg-muted/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted text-[10px] font-black text-foreground">
                              {worker.nom_complet.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-size-sm font-black text-foreground uppercase truncate max-w-[150px]">{worker.nom_complet}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-size-sm font-semibold text-muted-foreground uppercase">{formatMetier(worker)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-size-sm font-black text-indigo-600 uppercase">{worker.type_paiement}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-size-sm font-black text-foreground">{formatCurrency(getTaux(worker), enterprise?.devise)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest',
                                worker.actif
                                  ? 'bg-emerald-500/10 text-emerald-700'
                                  : 'bg-rose-500/10 text-rose-700'
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
                   Reste à dépenser
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
