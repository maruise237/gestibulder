'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Layers,
  Loader2,
  Calendar,
  HardHat,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Ruler,
  Save,
  Trash2,
  ChevronRight,
  Search,
  Filter,
} from 'lucide-react';
import { getProjects } from '@/lib/server/project.actions';
import { getWorkers } from '@/lib/server/worker.actions';
import { logAttendance, getAttendance, deleteAttendance } from '@/lib/server/attendance.actions';
import { Project } from '@/types/project';
import { Worker } from '@/types/worker';
import { Attendance, NewAttendance } from '@/types/attendance';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PointagePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [logs, setLogs] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [selectedChantier, setSelectedChantier] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [p, w] = await Promise.all([getProjects(), getWorkers()]);
    if (p.projects) setProjects(p.projects);
    if (w.workers) setWorkers(w.workers);

    if (selectedChantier) {
      const att = await getAttendance(selectedChantier, selectedDate);
      if (att.logs) setLogs(att.logs);
    }
    setIsLoading(false);
  }, [selectedChantier, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLog = async (
    worker: Worker,
    statut: 'present' | 'absent' | 'absent_justifie',
    extraData: Partial<NewAttendance> = {}
  ) => {
    if (!selectedChantier) return;

    setIsSubmitting(worker.id);
    const data: NewAttendance = {
      ouvrier_id: worker.id,
      chantier_id: selectedChantier,
      date: selectedDate,
      statut,
      quantite_produite: extraData.quantite_produite || 0,
      heure_arrivee: extraData.heure_arrivee || (statut === 'present' ? '08:00' : undefined),
      heure_depart: extraData.heure_depart || (statut === 'present' ? '17:00' : undefined),
      note: extraData.note,
    };

    const result = await logAttendance(data);

    if (result.error) {
      alert(result.error);
    } else {
      // Direct update of local state for immediate feedback
      setLogs((prev) => {
        const existingIndex = prev.findIndex((l) => l.ouvrier_id === worker.id);
        if (existingIndex > -1) {
          const newLogs = [...prev];
          newLogs[existingIndex] = result.log;
          return newLogs;
        }
        return [...prev, result.log];
      });
    }
    setIsSubmitting(null);
  };

  const handleDelete = async (logId: string) => {
    if (!confirm('Supprimer cette entrée ?')) return;
    await deleteAttendance(logId);
    const att = await getAttendance(selectedChantier, selectedDate);
    if (att.logs) setLogs(att.logs);
  };

  const getLogForWorker = (workerId: string) => {
    return logs.find((log) => log.ouvrier_id === workerId);
  };

  return (
    <div className="animate-in fade-in space-y-10 pb-20 duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-black tracking-tight text-zinc-950">Pointage Quotidien</h1>
          <p className="font-bold tracking-tight text-zinc-500">
            Suivi de la main d'œuvre et de la production en temps réel.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" leftIcon={<Filter size={16} />} className="font-black">
            Rapport détaillé
          </Button>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="sticky top-20 z-20 grid grid-cols-1 gap-6 transition-all duration-300 lg:grid-cols-2">
        <Card className="shadow-elevated border-zinc-200/60 bg-white p-6" padding="none">
          <div className="px-6">
            <label className="mb-2 block text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
              Localisation Chantier
            </label>
            <div className="group relative">
              <HardHat
                className="absolute top-1/2 left-0 -translate-y-1/2 text-zinc-400 transition-colors group-hover:text-indigo-600"
                size={20}
              />
              <select
                className="w-full cursor-pointer appearance-none bg-transparent pl-8 text-xl font-black tracking-tight text-zinc-950 outline-none"
                value={selectedChantier}
                onChange={(e) => setSelectedChantier(e.target.value)}
              >
                <option value="" className="font-bold text-zinc-900">
                  -- Sélectionner un chantier --
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
        <Card className="shadow-elevated border-zinc-200/60 bg-white p-6" padding="none">
          <div className="px-6">
            <label className="mb-2 block text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
              Date d'opération
            </label>
            <div className="group relative">
              <Calendar
                className="absolute top-1/2 left-0 -translate-y-1/2 text-zinc-400 transition-colors group-hover:text-indigo-600"
                size={20}
              />
              <input
                type="date"
                className="w-full cursor-pointer appearance-none bg-transparent pl-8 text-xl font-black tracking-tight text-zinc-950 outline-none"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 text-zinc-400">
          <Loader2 className="mb-4 animate-spin" size={40} />
          <p className="font-black tracking-tight">Synchronisation des données...</p>
        </div>
      ) : !selectedChantier ? (
        <Card className="border-2 border-dashed border-zinc-100 bg-zinc-50/30 py-24 text-center">
          <Users size={48} className="mx-auto mb-6 opacity-10" />
          <p className="text-lg font-black text-zinc-400 italic">
            Veuillez sélectionner un chantier pour commencer le pointage.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-indigo-600 p-2.5 text-white shadow-lg shadow-indigo-100">
                <Users size={20} />
              </div>
              <div>
                <h2 className="text-xl leading-none font-black tracking-tight text-zinc-950">
                  Effectif Actif
                </h2>
                <p className="mt-1.5 text-xs font-bold tracking-widest text-zinc-400 uppercase">
                  {workers.length} ouvriers affectés
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-emerald-700">
                <CheckCircle2 size={14} />
                <span className="text-[10px] font-black tracking-widest uppercase">
                  {logs.filter((l) => l.statut === 'present').length} Présents
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {workers.map((worker) => {
              const log = getLogForWorker(worker.id);
              const isPending = isSubmitting === worker.id;

              return (
                <Card
                  key={worker.id}
                  className={cn(
                    'overflow-hidden border-l-8 transition-all duration-500',
                    log?.statut === 'present'
                      ? 'border-emerald-500 bg-emerald-50/10 shadow-emerald-50'
                      : log?.statut === 'absent'
                        ? 'border-red-500 bg-red-50/10 shadow-red-50'
                        : 'border-zinc-200'
                  )}
                  padding="none"
                >
                  <div className="p-8">
                    <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
                      <div className="flex items-center gap-5">
                        <div
                          className={cn(
                            'flex h-14 w-14 items-center justify-center rounded-2xl border text-xl font-black shadow-sm transition-all duration-300',
                            log?.statut === 'present'
                              ? 'border-emerald-500 bg-emerald-600 text-white'
                              : log?.statut === 'absent'
                                ? 'border-red-500 bg-red-600 text-white'
                                : 'border-zinc-200 bg-zinc-100 text-zinc-900'
                          )}
                        >
                          {worker.nom_complet.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-2xl font-black tracking-tight text-zinc-950">
                            {worker.nom_complet}
                          </h3>
                          <div className="mt-1.5 flex items-center gap-3">
                            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
                              {worker.metier}
                            </span>
                            {log && (
                              <button
                                onClick={() => handleDelete(log.id)}
                                className="text-[10px] font-black tracking-widest text-red-500 uppercase hover:underline"
                              >
                                Réinitialiser
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {!log ? (
                        <div className="flex gap-4">
                          <Button
                            isLoading={isPending}
                            onClick={() => handleLog(worker, 'present')}
                            className="h-16 w-full flex-1 rounded-2xl bg-indigo-600 text-base font-black text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 lg:w-48 lg:flex-none"
                            leftIcon={<CheckCircle2 size={20} />}
                          >
                            PRÉSENT
                          </Button>
                          <Button
                            variant="outline"
                            isLoading={isPending}
                            onClick={() => handleLog(worker, 'absent')}
                            className="h-16 w-full flex-1 rounded-2xl border-zinc-200 text-base font-black hover:border-red-200 hover:bg-red-50 hover:text-red-600 lg:w-48 lg:flex-none"
                            leftIcon={<XCircle size={20} />}
                          >
                            ABSENT
                          </Button>
                        </div>
                      ) : log.statut === 'present' ? (
                        <div className="animate-in fade-in slide-in-from-right-4 flex flex-1 flex-col items-end gap-6 duration-500 lg:flex-row lg:items-center lg:justify-end">
                          <div className="grid w-full grid-cols-2 gap-4 lg:w-auto">
                            <div className="space-y-1.5">
                              <label className="flex items-center gap-1.5 text-[9px] font-black tracking-[0.2em] text-zinc-400 uppercase">
                                <Clock size={10} /> Arrivée
                              </label>
                              <input
                                type="time"
                                defaultValue={log.heure_arrivee || '08:00'}
                                onBlur={(e) =>
                                  handleLog(worker, 'present', {
                                    ...log,
                                    heure_arrivee: e.target.value,
                                  })
                                }
                                className="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-black transition-all outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="flex items-center gap-1.5 text-[9px] font-black tracking-[0.2em] text-zinc-400 uppercase">
                                <Clock size={10} /> Départ
                              </label>
                              <input
                                type="time"
                                defaultValue={log.heure_depart || '17:00'}
                                onBlur={(e) =>
                                  handleLog(worker, 'present', {
                                    ...log,
                                    heure_depart: e.target.value,
                                  })
                                }
                                className="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-black transition-all outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5"
                              />
                            </div>
                          </div>
                          <div className="w-full space-y-1.5 lg:w-64">
                            <label className="flex items-center gap-1.5 text-[9px] font-black tracking-[0.2em] text-zinc-400 uppercase">
                              <Ruler size={10} /> Production ({worker.unite_production})
                            </label>
                            <div className="group relative">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                defaultValue={log.quantite_produite || ''}
                                onBlur={(e) =>
                                  handleLog(worker, 'present', {
                                    ...log,
                                    quantite_produite: Number(e.target.value),
                                  })
                                }
                                className="h-14 w-full rounded-xl border border-zinc-200 bg-white pr-16 pl-5 text-2xl font-black transition-all outline-none focus:border-indigo-600 focus:ring-8 focus:ring-indigo-600/5"
                              />
                              <span className="absolute top-1/2 right-5 -translate-y-1/2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                                {worker.unite_production}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50 px-6 py-4 duration-500">
                          <XCircle size={20} className="text-red-600" />
                          <span className="text-sm font-black tracking-widest text-red-700 uppercase">
                            Marqué Absent
                          </span>
                          <button
                            onClick={() => handleLog(worker, 'present')}
                            className="ml-4 text-xs font-black text-zinc-950 underline decoration-2 underline-offset-4"
                          >
                            Passer en présent
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
