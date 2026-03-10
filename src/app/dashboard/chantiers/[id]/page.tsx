'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  HardHat,
  Users,
  Package,
  Wallet,
  Calendar,
  Clock,
  ArrowLeft,
  MapPin,
  Target,
  Loader2,
  TrendingUp,
  MoreVertical,
  Plus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { getProjectById } from '@/lib/server/project.actions';
import { getWorkersByProject } from '@/lib/server/worker.actions';
import { getMaterials } from '@/lib/server/stock.actions';
import { getExpenses } from '@/lib/server/expense.actions';
import { getAttendance } from '@/lib/server/attendance.actions';
import { Project } from '@/types/project';
import { Worker } from '@/types/worker';
import { Material } from '@/types/stock';
import { Expense } from '@/types/expense';
import { Attendance } from '@/types/attendance';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { useApp } from '@/lib/context/app-context';

export default function ProjectDetailPage() {
  const { enterprise } = useApp();
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [todayAttendance, setAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'workforce' | 'inventory' | 'finances'>(
    'overview'
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const projectId = id as string;

      const [p, w, m, e, a] = await Promise.all([
        getProjectById(projectId),
        getWorkersByProject(projectId),
        getMaterials(projectId),
        getExpenses(projectId),
        getAttendance(projectId, new Date().toISOString().split('T')[0]),
      ]);

      if (p.project) setProject(p.project);
      if (w.workers) setWorkers(w.workers);
      if (m.materials) setMaterials(m.materials);
      if (e.expenses) setExpenses(e.expenses);
      if (a.logs) setAttendance(a.logs);

      setIsLoading(false);
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="mb-4 animate-spin text-zinc-400" size={40} />
        <p className="font-bold tracking-tight text-zinc-500">Loading site data...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-black">Project not found</h2>
        <Button onClick={() => router.push('/dashboard/chantiers')} className="mt-4">
          Back to projects
        </Button>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.montant, 0);
  const margin = project.budget_total
    ? (((project.budget_total - totalExpenses) / project.budget_total) * 100).toFixed(1)
    : null;

  return (
    <div className="animate-in fade-in space-y-10 duration-500">
      {/* Project Header */}
      <div className="flex flex-col space-y-6">
        <button
          onClick={() => router.push('/dashboard/chantiers')}
          className="flex w-fit items-center gap-2 text-xs font-bold tracking-widest text-zinc-400 uppercase transition-colors hover:text-zinc-950"
        >
          <ArrowLeft size={14} strokeWidth={3} />
          Back to projects
        </button>

        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-black tracking-widest text-indigo-700 uppercase">
                Site ID: {project.id.slice(0, 8)}
              </span>
              <span
                className={cn(
                  'rounded-full border px-3 py-1 text-[10px] font-black tracking-widest uppercase',
                  project.statut === 'en_cours'
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                    : 'border-zinc-200 bg-zinc-100 text-zinc-700'
                )}
              >
                {project.statut === 'en_cours' ? 'Active' : project.statut}
              </span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-zinc-950">{project.nom}</h1>
            <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-zinc-500">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-indigo-500" />
                {project.adresse || 'No address set'}
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-indigo-500" />
                Started {new Date(project.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" leftIcon={<Clock size={16} />}>
              History
            </Button>
            <Button leftIcon={<Plus size={16} />}>Record Activity</Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex w-fit items-center gap-2 rounded-2xl border border-zinc-200/60 bg-zinc-100/50 p-1.5">
        {(['overview', 'workforce', 'inventory', 'finances'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'rounded-xl px-6 py-2.5 text-xs font-black tracking-widest uppercase transition-all',
              activeTab === tab
                ? 'border border-zinc-200 bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-600'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8 duration-500">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="group border-l-4 border-l-indigo-500 p-8">
              <p className="mb-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                Workforce
              </p>
              <p className="mb-4 text-3xl font-black text-zinc-950">{workers.length}</p>
              <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-emerald-600 uppercase">
                <CheckCircle2 size={12} /> {todayAttendance.length} Present today
              </div>
            </Card>
            <Card className="group border-l-4 border-l-amber-500 p-8">
              <p className="mb-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                Inventory Alerts
              </p>
              <p className="mb-4 text-3xl font-black text-zinc-950">
                {materials.filter((m) => (m.stock_actuel || 0) <= m.seuil_alerte).length}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-amber-600 uppercase">
                <AlertCircle size={12} /> Action required
              </div>
            </Card>
            <Card className="group border-l-4 border-l-emerald-500 p-8">
              <p className="mb-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                Budget Consumed
              </p>
              <p className="mb-4 text-3xl font-black text-zinc-950">
                {formatCurrency(totalExpenses, enterprise?.devise)}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                Total: {formatCurrency(project.budget_total || 0, enterprise?.devise)}
              </div>
            </Card>
            <Card className="group border-l-4 border-l-zinc-950 p-8">
              <p className="mb-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                Project Margin
              </p>
              <p
                className={cn(
                  'mb-4 text-3xl font-black',
                  Number(margin) > 0 ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {margin ? `${margin}%` : '--'}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                Current site profitability
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Progress */}
            <Card className="p-10 lg:col-span-2">
              <div className="mb-10 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tight">Construction Progress</h3>
                  <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                    Overall completion rate
                  </p>
                </div>
                <div className="text-4xl font-black tracking-tighter text-indigo-600">
                  {project.avancement_pct || 0}%
                </div>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full border border-zinc-200/60 bg-zinc-100 p-1">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-1000"
                  style={{ width: `${project.avancement_pct || 0}%` }}
                />
              </div>
              <div className="mt-10 grid grid-cols-3 gap-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                    Target Date
                  </p>
                  <p className="text-sm font-black text-zinc-950">
                    {project.date_fin_prevue ? formatDate(project.date_fin_prevue) : 'Not set'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                    Days Elapsed
                  </p>
                  <p className="text-sm font-black text-zinc-950">42 Days</p>
                </div>
                <div className="space-y-2 text-right">
                  <p className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                    Efficiency
                  </p>
                  <p className="text-sm font-black text-emerald-600">+8.2%</p>
                </div>
              </div>
            </Card>

            {/* Recent Activity Mini */}
            <Card className="flex flex-col overflow-hidden p-0" padding="none">
              <div className="border-b border-zinc-100 bg-zinc-50/30 p-8">
                <h3 className="text-lg font-black tracking-tight">Daily Log</h3>
              </div>
              <div className="flex-1 divide-y divide-zinc-100">
                {todayAttendance.length === 0 ? (
                  <div className="p-10 text-center text-sm font-bold text-zinc-400 italic">
                    No logs for today.
                  </div>
                ) : (
                  todayAttendance.slice(0, 5).map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600">
                          <CheckCircle2 size={14} />
                        </div>
                        <span className="max-w-[120px] truncate text-sm font-black text-zinc-950">
                          {workers.find((w) => w.id === log.ouvrier_id)?.nom_complet}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-zinc-400 uppercase">
                        {log.heure_arrivee}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-auto bg-zinc-50/50 p-6">
                <Button
                  variant="ghost"
                  className="h-10 w-full text-[10px] font-black tracking-widest text-indigo-600 uppercase"
                >
                  View All Pointages
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Other tabs would go here, following the same UI standards */}
      {activeTab !== 'overview' && (
        <Card className="border-dashed py-32 text-center">
          <div className="mb-6 inline-flex rounded-3xl bg-zinc-50 p-6 text-zinc-300">
            <Target size={48} strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-2xl font-black tracking-tight text-zinc-950">
            Module Detail {activeTab}
          </h2>
          <p className="mx-auto max-w-sm font-medium text-zinc-500">
            This specific view is being integrated with the global {activeTab} module.
          </p>
        </Card>
      )}
    </div>
  );
}
