'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/context/app-context';
import { getProjects } from '@/lib/server/project.actions';
import { getWorkers } from '@/lib/server/worker.actions';
import { getAttendance, logAttendance, deleteAttendance } from '@/lib/server/attendance.actions';
import {
  CheckCircle2,
  XCircle,
  Clock,
  HardHat,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function PointagePage() {

  const { selectedProjectId: selectedChantier } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const wRes = await getWorkers(1, 1000);

    if (selectedChantier) {
      const filteredWorkers = (wRes.workers || []).filter(w => w.actif);
      setWorkers(filteredWorkers);
      const aRes = await getAttendance(selectedChantier, selectedDate);
      if (aRes.logs) setLogs(aRes.logs);
    }
    setIsLoading(false);
  }, [selectedChantier, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLog = async (worker: any, status: 'present' | 'absent', existingLog?: any) => {
    setIsSubmitting(worker.id);
    const data: any = {
      chantier_id: selectedChantier,
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

  if (!selectedChantier) {
    return (
      <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl">Pointages</h1>
            <p className="hidden text-size-xs font-medium text-muted-foreground sm:block">Registre quotidien des effectifs.</p>
          </div>
        </div>
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <HardHat size={48} className="text-muted-foreground/20 mb-4" />
          <h3 className="text-size-lg font-semibold text-foreground mb-1">Aucun chantier sélectionné</h3>
          <p className="text-xs font-medium text-muted-foreground">
            Veuillez sélectionner un chantier en haut de la page pour gérer les pointages.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      {/* Header */}
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

      {isLoading && workers.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
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
