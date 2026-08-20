'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { getProjectById, updateProjectStatus, updateProjectProgress, getProjectActivity, deleteProject } from '@/lib/server/project.actions';
import { getWorkers } from '@/lib/server/worker.actions';
import { getMaterials } from '@/lib/server/stock.actions';
import { getBudgetData } from '@/lib/server/dashboard.actions';
import { getAttendance } from '@/lib/server/attendance.actions';
import {
  MapPin,
  Calendar,
  Loader2,
  ChevronLeft,
  Package,
  Wallet,
  Search,
  History,
  Activity as ActivityIcon,
  Trash2
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { label, PAYMENT_TYPE_LABELS, PROJECT_STATUS_LABELS, EXPENSE_CATEGORY_LABELS } from '@/lib/labels';
import { getTauxJournalierEffectif } from '@/lib/payroll';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useApp } from '@/lib/context/app-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { enterprise } = useApp();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'workforce' | 'inventory' | 'finances'>('overview');
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    const result = await deleteProject(id);
    setIsDeleting(false);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Chantier supprimé.');
      router.push('/dashboard/chantiers');
    }
  };

  const formatMetier = (worker: Worker) => {
    return worker.metier === 'autre' ? worker.metier_custom : worker.metier;
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

  if (!project) return <div className="p-8 text-center font-black">Projet non trouvé</div>;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.montant, 0);
  const marginValue = project.budget_total - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/chantiers"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        <ChevronLeft size={14} />
        Retour aux chantiers
      </Link>

      {/* Header Profile */}
      <div className="flex flex-col gap-6 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-size-3xl font-medium text-foreground">
            {project.nom}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {project.adresse || 'Non spécifié'}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar size={12} /> Fin prévue le {project.date_fin_prevue ? formatDate(project.date_fin_prevue) : 'non définie'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
           <div className="flex items-center gap-2 border border-border p-1">
             <Select
               value={project.statut}
               onValueChange={handleUpdateStatus}
               disabled={isUpdating}
             >
               <SelectTrigger className="h-8 w-[140px] border-none bg-transparent text-xs shadow-none">
                 <SelectValue>
                   {(value: string) => label(PROJECT_STATUS_LABELS, value)}
                 </SelectValue>
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
               <span className="text-xs text-muted-foreground">Progrès</span>
               <div className="flex items-center gap-1">
                 <Input
                   type="number"
                   min="0"
                   max="100"
                   defaultValue={project.avancement_pct || 0}
                   onBlur={(e) => handleUpdateProgress(Number(e.target.value))}
                   disabled={isUpdating}
                   className="font-tabular h-7 w-14 border-border bg-background px-1 text-center text-xs"
                 />
                 <span className="text-xs text-muted-foreground">%</span>
               </div>
             </div>
           </div>

           <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => setActivityModalOpen(true)}>
             <History size={14} className="mr-1.5" /> Historique
           </Button>
           <Button size="sm" className="h-8 px-3 text-xs" onClick={() => setActivityModalOpen(true)}>
             <ActivityIcon size={14} className="mr-1.5" /> Activité
           </Button>
           <Popover>
             <PopoverTrigger asChild>
               <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5 hover:text-destructive">
                 <Trash2 size={14} />
               </Button>
             </PopoverTrigger>
             <PopoverContent align="end" className="w-72 space-y-3">
               <p className="text-xs font-medium text-foreground">Supprimer ce chantier ?</p>
               <p className="text-xs text-muted-foreground">
                 Possible uniquement s'il n'a aucun pointage ni dépense enregistrés. Sinon, marquez-le "Terminé" plutôt.
               </p>
               <Button
                 variant="destructive"
                 size="sm"
                 className="w-full"
                 disabled={isDeleting}
                 onClick={handleDeleteProject}
               >
                 {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmer la suppression'}
               </Button>
             </PopoverContent>
           </Popover>
        </div>
      </div>

      {/* Activity Modal */}
      <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <DialogHeader className="border-b border-border p-6">
            <DialogTitle className="font-display text-xl font-medium flex items-center gap-2">
              <History size={18} className="text-muted-foreground" /> Journal d'activité
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-6">
            {activities.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Aucune activité enregistrée.
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-border">
                {activities.map((act) => (
                  <div key={act.id} className="relative pl-10">
                    <div className={cn(
                      "absolute left-0 top-0 h-8 w-8 rounded-full flex items-center justify-center border-2 border-background",
                      act.type === 'expense' ? "bg-destructive/10 text-destructive" :
                      act.subType === 'entree' ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    )}>
                      {act.type === 'expense' ? <Wallet size={14} /> : <Package size={14} />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground leading-tight">{act.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={cn(
                          "font-tabular text-size-sm font-medium",
                          act.type === 'expense' ? "text-destructive" :
                          act.subType === 'entree' ? "text-success" : "text-warning"
                        )}>
                          {act.type === 'expense' ? `- ${formatCurrency(act.amount, enterprise?.devise)}` :
                           `${act.subType === 'entree' ? '+' : '-'}${act.amount} ${act.unit}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
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
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto p-1 sm:w-fit">
          {[
            { id: 'overview', label: 'Vue d\'ensemble' },
            { id: 'workforce', label: 'Main d\'œuvre' },
            { id: 'inventory', label: 'Stocks' },
            { id: 'finances', label: 'Finances' }
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="whitespace-nowrap px-4 py-2 text-xs font-medium"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="border-border p-6">
                <div className="mb-6 flex items-center justify-between">
                   <h2 className="font-display text-lg font-medium text-foreground">Statut d'avancement</h2>
                   <span className="font-tabular text-size-2xl font-medium text-primary">{project.avancement_pct || 0}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted overflow-hidden">
                   <div
                     className="h-full bg-primary transition-all duration-1000 ease-out"
                     style={{ width: `${project.avancement_pct || 0}%` }}
                   />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-6 border-t border-border pt-6 sm:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Effectif total</p>
                    <p className="font-tabular text-size-xl font-medium text-foreground">{workers.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Présents (jour)</p>
                    <p className="font-tabular text-size-xl font-medium text-success">
                      {todayAttendance.filter(a => a.statut === 'present').length}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Alertes stock</p>
                    <p className="font-tabular text-size-xl font-medium text-warning">
                      {materials.filter(m => (m.stock_actuel || 0) <= m.seuil_alerte).length}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Budget consommé</p>
                    <p className="font-tabular text-size-xl font-medium text-foreground">
                       {project.budget_total > 0 ? Math.round((totalExpenses / project.budget_total) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 divide-y divide-border border border-border sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
                 <Link href="/dashboard/pointage" className="block p-6 transition-colors hover:bg-muted/30">
                   <div className="flex items-center justify-between">
                     <h3 className="text-xs text-muted-foreground">Main d'œuvre</h3>
                     <span className="text-xs text-primary">Pointage →</span>
                   </div>
                   <p className="font-tabular mt-2 text-size-xl font-medium text-foreground">{workers.length} <span className="font-sans text-size-sm font-normal text-muted-foreground">ouvriers</span></p>
                 </Link>

                 <Link href="/dashboard/stocks" className="block p-6 transition-colors hover:bg-muted/30">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs text-muted-foreground">Matériaux</h3>
                      <span className="text-xs text-primary">Stocks →</span>
                    </div>
                    <p className="font-tabular mt-2 text-size-xl font-medium text-foreground">{materials.length} <span className="font-sans text-size-sm font-normal text-muted-foreground">références</span></p>
                 </Link>
              </div>
            </div>

            <div className="space-y-6">
               <Card className="border-border p-6">
                 <p className="text-xs text-muted-foreground">Budget total</p>
                 <p className="font-tabular mt-1 text-size-2xl font-medium text-foreground">{formatCurrency(project.budget_total, enterprise?.devise)}</p>
               </Card>

               <Card className="border-border p-6">
                  <p className="text-xs text-muted-foreground">Dépenses réelles</p>
                  <p className="font-tabular mt-1 text-size-2xl font-medium text-foreground">{formatCurrency(totalExpenses, enterprise?.devise)}</p>
               </Card>

               <Card className="border-border p-6">
                  <p className="text-xs text-muted-foreground">Marge actuelle</p>
                  <p className={cn(
                    "font-tabular mt-1 text-size-2xl font-medium",
                    marginValue > 0 ? "text-success" : "text-destructive"
                  )}>{formatCurrency(marginValue, enterprise?.devise)}</p>
               </Card>
            </div>
          </div>
        )}

        {activeTab === 'workforce' && (
          <Card className="overflow-hidden border-border" padding="none">
            <div className="flex flex-col justify-between gap-4 border-b border-border p-4 sm:p-6 md:flex-row md:items-center">
              <h3 className="font-display text-lg font-medium text-foreground">Main d'œuvre — ouvriers affectés</h3>
              <div className="group relative">
                <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input
                  type="text"
                  placeholder="Rechercher..."
                  className="h-9 w-full pl-9 text-xs font-medium sm:w-64"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead className="px-6 py-3">Nom complet</TableHead>
                  <TableHead className="px-6 py-3">Métier</TableHead>
                  <TableHead className="px-6 py-3">Paiement</TableHead>
                  <TableHead className="px-6 py-3">Taux</TableHead>
                  <TableHead className="px-6 py-3 text-center">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                       Aucun ouvrier affecté.
                    </TableCell>
                  </TableRow>
                ) : (
                  workers.map((worker) => (
                    <TableRow key={worker.id}>
                      <TableCell className="px-6 py-4">
                        <span className="text-size-sm font-medium text-foreground truncate max-w-[150px]">{worker.nom_complet}</span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="text-size-sm text-muted-foreground">{formatMetier(worker)}</span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="text-size-sm text-foreground">{label(PAYMENT_TYPE_LABELS, worker.type_paiement)}</span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="font-tabular text-size-sm font-medium text-foreground">{formatCurrency(getTauxJournalierEffectif(worker), enterprise?.devise)}</span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex justify-center">
                          <span
                            className={cn(
                              'px-2 py-0.5 text-xs',
                              worker.actif
                                ? 'text-success'
                                : 'text-destructive'
                            )}
                          >
                            {worker.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        {activeTab === 'inventory' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {materials.length === 0 ? (
              <Card className="col-span-full border-border">
                <EmptyState
                  icon={Package}
                  title="Aucun matériau"
                  description="Aucun matériau enregistré pour ce chantier."
                />
              </Card>
            ) : (
              materials.map((mat) => {
                const stock = mat.stock_actuel || 0;
                const isLow = stock <= mat.seuil_alerte && stock > 0;
                const isOut = stock <= 0;

                return (
                  <Card
                    key={mat.id}
                    className="flex flex-col overflow-hidden border-border p-0"
                    padding="none"
                  >
                    <div className="p-6">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <h3 className="truncate text-size-lg font-medium text-foreground">
                          {mat.nom}
                        </h3>
                        {isOut ? (
                          <span className="shrink-0 text-xs font-medium text-destructive">Rupture</span>
                        ) : isLow ? (
                          <span className="shrink-0 text-xs font-medium text-warning">Critique</span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Seuil d'alerte : {mat.seuil_alerte} {mat.unite}
                      </p>

                      <div className="my-6 border-t border-b border-border py-4">
                        <span className={cn(
                          "font-display text-size-3xl font-medium",
                          isOut ? "text-destructive" : isLow ? "text-warning" : "text-foreground"
                        )}>
                          {stock}
                        </span>
                        <span className="ml-1.5 text-xs text-muted-foreground">{mat.unite}</span>
                      </div>

                      <p className="font-tabular text-xs text-muted-foreground">
                        Mis à jour le {new Date(mat.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'finances' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 divide-y divide-border border border-border md:grid-cols-2 md:divide-y-0 md:divide-x">
              <div className="p-6">
                <p className="text-xs text-muted-foreground">Total dépenses</p>
                <p className="font-tabular mt-1 text-size-2xl font-medium text-foreground">
                  {formatCurrency(totalExpenses, enterprise?.devise)}
                </p>
              </div>

              <div className="p-6">
                <p className="text-xs text-muted-foreground">Marge restante</p>
                <p className={cn(
                  "font-tabular mt-1 text-size-2xl font-medium",
                  marginValue > 0 ? "text-success" : "text-destructive"
                )}>
                  {formatCurrency(marginValue, enterprise?.devise)}
                </p>
              </div>
            </div>

            <Card className="overflow-hidden border-border" padding="none">
              <div className="border-b border-border p-4 sm:p-6">
                <h2 className="font-display text-lg font-medium text-foreground">
                  Grand livre
                </h2>
              </div>

              {expenses.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  Aucune transaction enregistrée.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {expenses.map((expense) => (
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
                      <div className="font-tabular shrink-0 text-size-sm font-medium text-destructive sm:text-size-base">
                        − {formatCurrency(expense.montant, enterprise?.devise)}
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
