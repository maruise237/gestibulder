'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getWorkersByProject } from '@/lib/server/worker.actions';
import { getAttendance, logAttendance, deleteAttendance } from '@/lib/server/attendance.actions';
import { useApp } from '@/lib/context/app-context';
import {
  CheckCircle2,
  Clock,
  HardHat,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function PointagePage() {
  const { selectedProjectId } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!selectedProjectId) return;
    setIsLoading(true);
    try {
      const [wRes, aRes] = await Promise.all([
        getWorkersByProject(selectedProjectId),
        getAttendance(selectedProjectId, selectedDate)
      ]);

      if (wRes.workers) setWorkers(wRes.workers.filter((w: any) => w.actif));
      if (aRes.logs) setLogs(aRes.logs);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  }, [selectedProjectId, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLog = async (worker: any, status: 'present' | 'absent', existingLog?: any) => {
    if (!selectedProjectId) return;
    setIsSubmitting(worker.id);
    const data: any = {
      chantier_id: selectedProjectId,
      ouvrier_id: worker.id,
      date: selectedDate,
      statut: status,
      heure_arrivee: existingLog?.heure_arrivee || '08:00',
      heure_depart: existingLog?.heure_depart || '17:00',
      quantite_produite: existingLog?.quantite_produite || 0,
    };

    const res = await logAttendance(data);
    if (!res.error) fetchData();
    setIsSubmitting(null);
  };

  const handleDelete = async (id: string) => {
    await deleteAttendance(id);
    fetchData();
  };

  const getLogForWorker = (workerId: string) => logs.find(l => l.ouvrier_id === workerId);

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl">Pointages</h1>
          <p className="hidden text-size-xs font-medium text-muted-foreground sm:block">Registre quotidien des effectifs.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-9 w-full sm:w-auto"
          />
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
      ) : isLoading && workers.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      ) : workers.length === 0 ? (
        <Card className="border-2 border-dashed border-border bg-muted/30 py-12 text-center">
           <p className="text-muted-foreground">Aucun ouvrier actif affecté à ce chantier.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {workers.map((worker) => {
            const log = getLogForWorker(worker.id);
            const isPending = isSubmitting === worker.id;

            return (
              <Card key={worker.id} className={cn(
                "overflow-hidden transition-all duration-200 border-border",
                log?.statut === 'present' ? "bg-emerald-500/5 border-emerald-500/20 shadow-sm" :
                log?.statut === 'absent' ? "bg-destructive/5 border-destructive/20 shadow-sm" : "bg-card"
              )} padding="none">
                <div className="p-3 sm:p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-xs font-semibold",
                        log?.statut === 'present' ? "bg-emerald-600 text-white border-emerald-700 shadow-sm" :
                        log?.statut === 'absent' ? "bg-destructive text-white border-destructive/80 shadow-sm" : "bg-muted text-muted-foreground border-border"
                      )}>
                        {worker.nom_complet.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-size-sm font-semibold text-foreground">{worker.nom_complet}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase">{worker.metier}</span>
                          {log && (
                            <button onClick={() => handleDelete(log.id)} className="text-[9px] font-semibold text-muted-foreground hover:text-destructive uppercase tracking-widest transition-colors">
                              Reset
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
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 sm:flex-none sm:w-24 h-8 text-[10px] uppercase font-semibold"
                        >
                          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Présent'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLog(worker, 'absent')}
                          disabled={isPending}
                          className="flex-1 sm:flex-none sm:w-24 h-8 text-[10px] uppercase font-semibold border-border"
                        >
                          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Absent'}
                        </Button>
                      </div>
                    ) : log.statut === 'present' ? (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:ml-auto">
                         <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Input
                                type="time"
                                className="h-7 w-full py-0 text-[10px] font-medium sm:w-24"
                                defaultValue={log.heure_arrivee || '08:00'}
                                onBlur={(e) => handleLog(worker, 'present', { ...log, heure_arrivee: e.target.value })}
                              />
                            </div>
                            <div className="flex-1">
                              <Input
                                type="time"
                                className="h-7 w-full py-0 text-[10px] font-medium sm:w-24"
                                defaultValue={log.heure_depart || '17:00'}
                                onBlur={(e) => handleLog(worker, 'present', { ...log, heure_depart: e.target.value })}
                              />
                            </div>
                         </div>
                         <div className="w-full sm:w-28">
                            <Input
                              type="number"
                              className="h-7 w-full py-0 text-[10px] font-medium"
                              placeholder="0.00"
                              defaultValue={log.quantite_produite || ''}
                              onBlur={(e) => handleLog(worker, 'present', { ...log, quantite_produite: Number(e.target.value) })}
                            />
                         </div>
                         <Badge variant="outline" className="w-fit h-5 text-[8px] bg-emerald-500/10 text-emerald-700 border-emerald-500/20 uppercase tracking-widest font-semibold">Validé</Badge>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 bg-destructive/10 px-3 py-1 rounded-md sm:ml-auto">
                        <span className="text-[10px] font-semibold text-destructive uppercase tracking-widest">Inactif aujourd'hui</span>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] font-semibold uppercase text-destructive hover:bg-destructive/5" onClick={() => handleLog(worker, 'present')}>
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
