'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getProjects } from '@/lib/server/project.actions';
import { getWorkers } from '@/lib/server/worker.actions';
import { getAttendance, logAttendance, deleteAttendance } from '@/lib/server/attendance.actions';
import { useApp } from '@/lib/context/app-context';
import {
  Users,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Ruler,
  Search,
  HardHat,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedChantier, setSelectedChantier] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [pRes, wRes] = await Promise.all([
      getProjects(),
      getWorkers(1, 1000)
    ]);

    if (pRes.projects) setProjects(pRes.projects);
    if (pRes.projects?.length && !selectedChantier) setSelectedChantier(pRes.projects[0].id);

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

  const handleChantierChange = (val: string | null) => {
    if (val) setSelectedChantier(val);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pointage & Présence</h1>
          <p className="text-sm text-muted-foreground">Registre quotidien des effectifs sur chantier.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-auto"
          />
          <Select value={selectedChantier} onValueChange={handleChantierChange}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Chantier" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedChantier ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-lg bg-muted/20">
          <HardHat className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-medium">Sélectionnez un chantier</h2>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {workers.map((worker) => {
            const log = getLogForWorker(worker.id);
            const isPending = isSubmitting === worker.id;

            return (
              <Card key={worker.id} className={cn(
                "transition-colors",
                log?.statut === 'present' ? "border-emerald-200 bg-emerald-50/30" :
                log?.statut === 'absent' ? "border-red-200 bg-red-50/30" : ""
              )}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                        log?.statut === 'present' ? "bg-emerald-600 text-white" :
                        log?.statut === 'absent' ? "bg-red-600 text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {worker.nom_complet.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{worker.nom_complet}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">{worker.metier_specialise || 'Ouvrier'}</Badge>
                          {log && (
                            <button onClick={() => handleDelete(log.id)} className="text-[10px] text-muted-foreground hover:text-destructive underline underline-offset-2">
                              Réinitialiser
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {!log ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleLog(worker, 'present')}
                          disabled={isPending}
                          className="w-full sm:w-28 bg-emerald-600 hover:bg-emerald-700"
                        >
                          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                          Présent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLog(worker, 'absent')}
                          disabled={isPending}
                          className="w-full sm:w-28"
                        >
                          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                          Absent
                        </Button>
                      </div>
                    ) : log.statut === 'present' ? (
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                         <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground uppercase">Arrivée</Label>
                              <Input
                                type="time"
                                className="h-8 py-0 text-xs"
                                defaultValue={log.heure_arrivee || '08:00'}
                                onBlur={(e) => handleLog(worker, 'present', { ...log, heure_arrivee: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground uppercase">Départ</Label>
                              <Input
                                type="time"
                                className="h-8 py-0 text-xs"
                                defaultValue={log.heure_depart || '17:00'}
                                onBlur={(e) => handleLog(worker, 'present', { ...log, heure_depart: e.target.value })}
                              />
                            </div>
                         </div>
                         <div className="space-y-1 w-full sm:w-32">
                            <Label className="text-[10px] text-muted-foreground uppercase">Production ({worker.unite_production})</Label>
                            <Input
                              type="number"
                              className="h-8 py-0 text-xs"
                              placeholder="0.00"
                              defaultValue={log.quantite_produite || ''}
                              onBlur={(e) => handleLog(worker, 'present', { ...log, quantite_produite: Number(e.target.value) })}
                            />
                         </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-red-100/50 px-3 py-1.5 rounded-md">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700">Absent</span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleLog(worker, 'present')}>
                          Changer
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
