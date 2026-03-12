'use client';

import React, { useState } from 'react';
import { getWorkersByProject } from '@/lib/server/worker.actions';
import { getAttendance, logAttendance, deleteAttendance } from '@/lib/server/attendance.actions';
import { useApp } from '@/lib/context/app-context';
import {
  CheckCircle2,
  Clock,
  HardHat,
  Loader2,
  Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function PointagePage() {
  const { selectedProjectId } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: workers = [], isLoading: isLoadingWorkers } = useQuery({
    queryKey: ['workers', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const res = await getWorkersByProject(selectedProjectId);
      if (res.error) throw new Error(res.error);
      return res.workers?.filter((w: any) => w.actif) || [];
    },
    enabled: !!selectedProjectId,
  });

  const { data: logs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['attendance', selectedProjectId, selectedDate],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const res = await getAttendance(selectedProjectId, selectedDate);
      if (res.error) throw new Error(res.error);
      return res.logs || [];
    },
    enabled: !!selectedProjectId,
  });

  const mutation = useMutation({
    mutationFn: logAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedProjectId, selectedDate] });
      setIsSubmitting(null);
    },
    onError: () => {
      setIsSubmitting(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedProjectId, selectedDate] });
    }
  });

  const handleLog = async (worker: any, status: 'present' | 'absent', existingLog?: any) => {
    if (!selectedProjectId) return;
    setIsSubmitting(worker.id);

    mutation.mutate({
      chantier_id: selectedProjectId,
      ouvrier_id: worker.id,
      date: selectedDate,
      statut: status,
      heure_arrivee: existingLog?.heure_arrivee || '08:00',
      heure_depart: existingLog?.heure_depart || '17:00',
      quantite_produite: existingLog?.quantite_produite || 0,
    } as any);
  };

  const getLogForWorker = (workerId: string) => logs.find((l: any) => l.ouvrier_id === workerId);

  const isLoading = isLoadingWorkers || isLoadingLogs;

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl">Pointages</h1>
          <p className="hidden text-size-xs font-medium text-muted-foreground sm:block">Registre quotidien des effectifs.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 w-full pl-9 sm:w-auto font-medium"
            />
          </div>
        </div>
      </div>

      {!selectedProjectId ? (
        <Card className="border-2 border-dashed border-border bg-muted/30 py-12 text-center">
          <div className="mb-4 inline-flex rounded-xl bg-background p-4 text-muted-foreground shadow-sm">
            <HardHat size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-size-xl font-semibold tracking-tight text-foreground">Sélectionnez un chantier</h2>
          <p className="text-size-sm text-muted-foreground mt-1">Veuillez choisir un chantier dans le menu supérieur pour gérer les pointages.</p>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : workers.length === 0 ? (
        <Card className="border-2 border-dashed border-border bg-muted/30 py-12 text-center">
           <p className="text-muted-foreground font-medium">Aucun ouvrier actif affecté à ce chantier.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {workers.map((worker: any) => {
            const log = getLogForWorker(worker.id);
            const isPending = isSubmitting === worker.id;

            return (
              <Card key={worker.id} className={cn(
                "overflow-hidden transition-all duration-300 border-border",
                log?.statut === 'present' ? "bg-emerald-500/5 border-emerald-500/20" :
                log?.statut === 'absent' ? "bg-destructive/5 border-destructive/20" : "bg-card"
              )} padding="none">
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-bold",
                        log?.statut === 'present' ? "bg-emerald-600 text-white border-emerald-700 shadow-sm" :
                        log?.statut === 'absent' ? "bg-destructive text-white border-destructive/80 shadow-sm" : "bg-muted text-muted-foreground border-border"
                      )}>
                        {worker.nom_complet.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-size-sm font-bold text-foreground uppercase">{worker.nom_complet}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{worker.metier === 'autre' ? worker.metier_custom : worker.metier}</span>
                          {log && (
                            <button
                              onClick={() => deleteMutation.mutate(log.id)}
                              className="text-[9px] font-bold text-muted-foreground hover:text-destructive uppercase tracking-widest transition-colors ml-2"
                            >
                              Réinitialiser
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {!log ? (
                      <div className="flex items-center gap-2 sm:ml-auto">
                        <Button
                          size="sm"
                          onClick={() => handleLog(worker, 'present')}
                          disabled={isPending}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 sm:flex-none sm:w-28 h-9 text-[10px] uppercase font-bold tracking-widest"
                        >
                          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Présent'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLog(worker, 'absent')}
                          disabled={isPending}
                          className="flex-1 sm:flex-none sm:w-28 h-9 text-[10px] uppercase font-bold tracking-widest border-border"
                        >
                          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Absent'}
                        </Button>
                      </div>
                    ) : log.statut === 'present' ? (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:ml-auto">
                         <div className="flex items-center gap-2">
                            <div className="space-y-1">
                              <label className="text-[8px] font-bold text-muted-foreground uppercase">Arrivée</label>
                              <Input
                                type="time"
                                className="h-8 w-24 py-0 text-[11px] font-bold"
                                defaultValue={log.heure_arrivee || '08:00'}
                                onBlur={(e) => handleLog(worker, 'present', { ...log, heure_arrivee: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-bold text-muted-foreground uppercase">Départ</label>
                              <Input
                                type="time"
                                className="h-8 w-24 py-0 text-[11px] font-bold"
                                defaultValue={log.heure_depart || '17:00'}
                                onBlur={(e) => handleLog(worker, 'present', { ...log, heure_depart: e.target.value })}
                              />
                            </div>
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] font-bold text-muted-foreground uppercase">Qte ({worker.unite_production})</label>
                            <Input
                              type="number"
                              className="h-8 w-full sm:w-24 py-0 text-[11px] font-bold"
                              placeholder="0.00"
                              defaultValue={log.quantite_produite || ''}
                              onBlur={(e) => handleLog(worker, 'present', { ...log, quantite_produite: Number(e.target.value) })}
                            />
                         </div>
                         <div className="pt-4 sm:pt-0">
                            <Badge className="h-6 bg-emerald-500 text-white border-none text-[9px] font-bold uppercase tracking-widest px-2">Confirmé</Badge>
                         </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-4 bg-destructive/10 px-4 py-2 rounded-xl sm:ml-auto">
                        <span className="text-[10px] font-bold text-destructive uppercase tracking-widest">Absent aujourd'hui</span>
                        <Button variant="ghost" size="sm" className="h-7 px-3 text-[10px] font-bold uppercase text-destructive hover:bg-destructive/20" onClick={() => handleLog(worker, 'present')}>
                          Modifier
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
