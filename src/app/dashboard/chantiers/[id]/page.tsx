'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProjects } from '@/lib/server/project.actions';
import { getWorkers } from '@/lib/server/worker.actions';
import { getAttendance } from '@/lib/server/attendance.actions';
import { getMaterials } from '@/lib/server/stock.actions';
import { getBudgetData } from '@/lib/server/dashboard.actions';
import { useApp } from '@/lib/context/app-context';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Target,
  MoreVertical,
  Plus,
  ArrowUpRight
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProjectDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { enterprise } = useApp();
  const [project, setProject] = useState<any>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pRes, wRes, aRes, mRes, bRes] = await Promise.all([
        getProjects(),
        getWorkers(1, 1000),
        getAttendance(id, new Date().toISOString().split('T')[0]),
        getMaterials(id),
        getBudgetData()
      ]);

      if (pRes.projects) {
        const p = pRes.projects.find((proj: any) => proj.id === id);
        setProject(p);
      }
      if (wRes.workers) setWorkers(wRes.workers);
      if (aRes.logs) setTodayAttendance(aRes.logs);
      if (mRes.materials) setMaterials(mRes.materials);
      if (bRes.expenses) {
        setExpenses(bRes.expenses.filter((e: any) => e.chantier_id === id));
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-64 w-full" /></div>;
  if (!project) return <div className="p-8 text-center">Projet non trouvé.</div>;

  const totalExpenses = expenses.reduce((acc, e) => acc + (e.montant || 0), 0);
  const margin = project.budget_total > 0
    ? ((project.budget_total - totalExpenses) / project.budget_total * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={project.statut === 'en_cours' ? 'default' : 'secondary'}>
              {project.statut === 'en_cours' ? 'En cours' : project.statut === 'preparation' ? 'Planification' : 'Terminé'}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">ID: {project.id.slice(0, 8)}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{project.nom}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-primary" />
              {project.adresse || 'Pas d\'adresse'}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-primary" />
              Débuté le {formatDate(project.created_at)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Clock className="mr-2 h-4 w-4" />
            Historique
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle activité
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="workforce">Effectifs</TabsTrigger>
          <TabsTrigger value="inventory">Matériaux</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <>
          {/* Top Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase">Effectif</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workers.length}</div>
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 size={12} /> {todayAttendance.length} Présents aujourd'hui
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase">Alertes Stock</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {materials.filter((m) => (m.stock_actuel || 0) <= m.seuil_alerte).length}
                </div>
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> Action requise
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase">Budget Consommé</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalExpenses, enterprise?.devise)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {formatCurrency(project.budget_total || 0, enterprise?.devise)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase">Rentabilité</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", Number(margin) > 0 ? "text-emerald-600" : "text-destructive")}>
                  {margin ? `${margin}%` : '--'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Marge estimée actuelle</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Avancement Detail Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle>Avancement du Chantier</CardTitle>
                    <CardDescription>Taux global de complétion des travaux</CardDescription>
                  </div>
                  <div className="text-3xl font-bold text-primary">{project.avancement_pct || 0}%</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${project.avancement_pct || 0}%` }} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Date d'échéance</p>
                    <p className="text-sm font-medium">{project.date_fin_prevue ? formatDate(project.date_fin_prevue) : 'Non définie'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Jours écoulés</p>
                    <p className="text-sm font-medium">-- Jours</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Performance</p>
                    <p className="text-sm font-medium text-emerald-600">Stable</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Journal du jour</CardTitle>
                <CardDescription>Présences enregistrées aujourd'hui</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayAttendance.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-4">Aucun pointage ce jour.</p>
                  ) : (
                    todayAttendance.slice(0, 5).map((log, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span className="text-sm font-medium truncate max-w-[120px]">
                            {workers.find(w => w.id === log.ouvrier_id)?.nom_complet}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{log.heure_arrivee}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 mt-2">
                <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                  <a href="/dashboard/pointage">Gérer le pointage</a>
                </Button>
              </CardFooter>
            </Card>
          </div>
          </>
        </TabsContent>

        <TabsContent value="workforce">
          <Card className="border-dashed py-24 text-center">
            <CardContent>
              <Users className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">Détails des effectifs</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">Cette vue détaillée est en cours d'intégration.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card className="border-dashed py-24 text-center">
            <CardContent>
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">Suivi des stocks local</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">Cette vue détaillée est en cours d'intégration.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finances">
          <Card className="border-dashed py-24 text-center">
            <CardContent>
              <Target className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">Analytique financière</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">Cette vue détaillée est en cours d'intégration.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
