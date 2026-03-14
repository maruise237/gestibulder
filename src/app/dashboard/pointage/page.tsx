"use client"

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/context/app-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar as CalendarIcon,
  QrCode,
  UserCheck,
  Printer,
  Plus,
  Loader2,
  AlertCircle,
  Users,
  BarChart3
} from 'lucide-react';
import { getWorkersByProject } from '@/lib/server/worker.actions';
import { getPointagesByChantier, initPointageJour } from '@/lib/server/pointage.actions';
import { PointageTable } from '@/components/dashboard/pointage/pointage-table';
import { QRScanner } from '@/components/dashboard/pointage/qr-scanner';
import { QRGenerator } from '@/components/dashboard/pointage/qr-generator';
import { PointageStats } from '@/components/dashboard/pointage/pointage-stats';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function PointagePage() {
  const { selectedProjectId } = useApp();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Fetch Workers
  const { data: workersData, isLoading: loadingWorkers } = useQuery({
    queryKey: ['workers', selectedProjectId],
    queryFn: () => getWorkersByProject(selectedProjectId!),
    enabled: !!selectedProjectId,
  });

  // Fetch Pointages
  const { data: pointagesData, isLoading: loadingPointages } = useQuery({
    queryKey: ['pointages', selectedProjectId, selectedDate],
    queryFn: () => getPointagesByChantier(selectedProjectId!, selectedDate),
    enabled: !!selectedProjectId && !!selectedDate,
  });

  const initMutation = useMutation({
    mutationFn: () => initPointageJour(selectedProjectId!, selectedDate),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(`${res.count} ouvriers initialisés en absent`);
        queryClient.invalidateQueries({ queryKey: ['pointages', selectedProjectId, selectedDate] });
      } else {
        toast.error(res.error || "Erreur lors de l'initialisation");
      }
    }
  });

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="bg-indigo-50 p-6 rounded-full mb-6">
          <AlertCircle className="h-12 w-12 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-black uppercase mb-2">Aucun projet sélectionné</h2>
        <p className="text-muted-foreground max-w-sm font-medium">
          Veuillez sélectionner un projet dans le sélecteur en haut pour gérer le pointage.
        </p>
      </div>
    );
  }

  const workers = workersData?.workers || [];
  const pointages = pointagesData?.pointages || [];

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">Gestion du Pointage</h1>
          <p className="text-muted-foreground font-medium mt-1">
            Enregistrez la présence de vos ouvriers et suivez les salaires journaliers.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-card border p-2 rounded-2xl shadow-sm">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div className="pr-4">
            <p className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-1">Date de pointage</p>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-8 border-none p-0 font-black text-sm focus-visible:ring-0"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="pointage" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto md:h-14 bg-muted/50 p-1.5 rounded-2xl gap-1">
          <TabsTrigger value="pointage" className="rounded-xl font-black text-[10px] md:text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
            <UserCheck className="w-4 h-4 mr-2 hidden sm:inline" />
            Pointage
          </TabsTrigger>
          <TabsTrigger value="scan" className="rounded-xl font-black text-[10px] md:text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
            <QrCode className="w-4 h-4 mr-2 hidden sm:inline" />
            Scan Rapide
          </TabsTrigger>
          <TabsTrigger value="qr-codes" className="rounded-xl font-black text-[10px] md:text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
            <Printer className="w-4 h-4 mr-2 hidden sm:inline" />
            Cartes QR
          </TabsTrigger>
          <TabsTrigger value="stats" className="rounded-xl font-black text-[10px] md:text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
            <BarChart3 className="w-4 h-4 mr-2 hidden sm:inline" />
            Rapports
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="pointage" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg uppercase">Liste des ouvriers</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => initMutation.mutate()}
                disabled={initMutation.isPending || workers.length === 0}
                className="rounded-xl h-10 px-4 font-bold text-[10px] uppercase tracking-widest border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                {initMutation.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Plus className="mr-2 h-3 w-3" />}
                Initialiser la journée
              </Button>
            </div>

            {loadingWorkers || loadingPointages ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Chargement des données...</p>
              </div>
            ) : workers.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 bg-muted/20 rounded-2xl">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground font-black uppercase text-sm">Aucun ouvrier trouvé pour ce projet</p>
                <Button variant="link" className="text-indigo-600 font-bold mt-2" onClick={() => window.location.href='/dashboard/ouvriers'}>
                  Ajouter des ouvriers →
                </Button>
              </Card>
            ) : (
              <PointageTable
                workers={workers}
                existingPointages={pointages}
                chantierId={selectedProjectId}
                date={selectedDate}
              />
            )}
          </TabsContent>

          <TabsContent value="scan">
            <QRScanner chantierId={selectedProjectId} />
          </TabsContent>

          <TabsContent value="qr-codes">
            <QRGenerator workers={workers} />
          </TabsContent>

          <TabsContent value="stats">
            <PointageStats chantierId={selectedProjectId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
