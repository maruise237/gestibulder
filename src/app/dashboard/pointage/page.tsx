"use client"

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/context/app-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
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
import { EmptyState } from '@/components/dashboard/empty-state';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function PointagePage() {
  const { selectedProjectId } = useApp();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Fetch Workers
  const { data: workersData, isLoading: loadingWorkers } = useQuery({
    queryKey: ['workers', selectedProjectId],
    queryFn: () => getWorkersByProject(selectedProjectId!, true),
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
        <div className="bg-primary/10 p-6 rounded-full mb-6">
          <AlertCircle className="h-12 w-12 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-medium mb-2">Aucun projet sélectionné</h2>
        <p className="text-muted-foreground max-w-sm text-size-sm">
          Veuillez sélectionner un projet dans le sélecteur en haut pour gérer le pointage.
        </p>
      </div>
    );
  }

  const workers = workersData?.workers || [];
  const pointages = pointagesData?.pointages || [];

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="text-size-3xl font-medium text-foreground">Gestion du pointage</h1>
          <p className="text-muted-foreground text-size-sm mt-1">
            Enregistrez la présence de vos ouvriers et suivez les salaires journaliers.
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Date de pointage</p>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="font-tabular h-9 w-44 text-sm"
          />
        </div>
      </div>

      <Tabs defaultValue="pointage" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="pointage" className="text-xs py-2">
            <UserCheck className="w-4 h-4 mr-2 hidden sm:inline" />
            Pointage
          </TabsTrigger>
          <TabsTrigger value="scan" className="text-xs py-2">
            <QrCode className="w-4 h-4 mr-2 hidden sm:inline" />
            Scan rapide
          </TabsTrigger>
          <TabsTrigger value="qr-codes" className="text-xs py-2">
            <Printer className="w-4 h-4 mr-2 hidden sm:inline" />
            Cartes QR
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-xs py-2">
            <BarChart3 className="w-4 h-4 mr-2 hidden sm:inline" />
            Rapports
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="pointage" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-medium text-foreground">Liste des ouvriers</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => initMutation.mutate()}
                disabled={initMutation.isPending || workers.length === 0}
                className="h-9 px-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                {initMutation.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Plus className="mr-2 h-3 w-3" />}
                Initialiser la journée
              </Button>
            </div>

            {loadingWorkers || loadingPointages ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground text-xs">Chargement des données...</p>
              </div>
            ) : workers.length === 0 ? (
              <Card className="border-border">
                <EmptyState
                  icon={Users}
                  title="Aucun ouvrier trouvé pour ce projet"
                  action={
                    <Button variant="link" onClick={() => window.location.href='/dashboard/ouvriers'}>
                      Ajouter des ouvriers →
                    </Button>
                  }
                />
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
