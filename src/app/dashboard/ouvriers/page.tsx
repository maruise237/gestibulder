'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkersByProject, deleteWorker, reactivateWorker } from '@/lib/server/worker.actions';
import { useApp } from '@/lib/context/app-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Search, Plus, Trash2, Edit, Users, HardHat, Loader2, Wallet, RotateCcw } from 'lucide-react';
import { CreateWorkerModal } from '@/components/dashboard/create-worker-modal';
import { ExportModal } from '@/components/dashboard/export-modal';
import { WorkerPaymentModal } from '@/components/dashboard/worker-payment-modal';
import { EmptyState } from '@/components/dashboard/empty-state';
import { cn, formatCurrency } from '@/lib/utils';
import { label, PAYMENT_TYPE_LABELS } from '@/lib/labels';
import { Worker } from '@/types/worker';

export default function WorkersPage() {
  const { selectedProjectId, enterprise } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; worker: any | null }>({
    open: false,
    worker: null
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['workers', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId || selectedProjectId === 'all') return { workers: [] };
      const res = await getWorkersByProject(selectedProjectId);
      if (res.error) throw new Error(res.error);
      return res;
    },
    enabled: !!selectedProjectId && selectedProjectId !== 'all',
  });

  const workers = data?.workers || [];

  const filteredWorkers = workers.filter(w =>
    w.nom_complet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMetier = (worker: Worker) => {
    return worker.metier === 'autre' ? worker.metier_custom : worker.metier;
  };

  const getTaux = (worker: Worker) => {
    switch (worker.type_paiement) {
      case 'journalier':
        return worker.taux_journalier || 0;
      case 'hebdomadaire':
        return worker.salaire_hebdo || 0;
      case 'mensuel':
        return worker.salaire_mensuel || 0;
      default:
        return 0;
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm("Désactiver cet ouvrier ? Il n'apparaîtra plus dans les listes de pointage, mais son historique de présence et de paiement sera conservé.")) return;
    const result = await deleteWorker(id);
    if (result.error) {
      alert(result.error);
    } else {
      refetch();
    }
  };

  const handleReactivate = async (id: string) => {
    const result = await reactivateWorker(id);
    if (result.error) {
      alert(result.error);
    } else {
      refetch();
    }
  };
  return (
    <div className="space-y-fluid-md">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-size-2xl font-medium text-foreground sm:text-size-3xl">Ouvriers</h1>
          <p className="hidden text-size-sm text-muted-foreground sm:block">
            Gestion de vos effectifs par chantier.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="group relative">
            <Search
              className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
              size={14}
            />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full pr-4 pl-9 text-xs font-medium focus:ring-4 focus:ring-primary/10 sm:w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <ExportModal />
            <CreateWorkerModal onWorkerCreated={refetch} />
          </div>
        </div>
      </div>

      {!selectedProjectId || selectedProjectId === 'all' ? (
        <Card className="border-border">
          <EmptyState
            icon={HardHat}
            title="Sélectionnez un chantier"
            description="Choisissez un chantier dans le menu supérieur pour voir les ouvriers affectés."
          />
        </Card>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mb-2 animate-spin text-primary" size={32} />
          <p className="text-xs font-medium">Chargement des effectifs...</p>
        </div>
      ) : workers.length === 0 ? (
        <Card className="border-border">
          <EmptyState
            icon={Users}
            title="Effectif vide"
            description="Personne n'a encore été affecté à ce chantier. Ajoutez vos premiers ouvriers pour commencer le pointage."
            action={
              <CreateWorkerModal onWorkerCreated={refetch}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un ouvrier
                </Button>
              </CreateWorkerModal>
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden border-border" padding="none">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">
                    Ouvrier
                  </TableHead>
                  <TableHead className="hidden px-4 py-3 sm:table-cell">
                    Métier
                  </TableHead>
                  <TableHead className="px-4 py-3">
                    Rémunération
                  </TableHead>
                  <TableHead className="px-4 py-3 text-center">
                    Statut
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkers.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-size-sm font-medium text-foreground">
                          {worker.nom_complet}
                        </span>
                        <span className="truncate text-xs text-muted-foreground sm:hidden">
                          {formatMetier(worker)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 sm:table-cell">
                      <div className="flex flex-col">
                        <span className="text-size-sm text-foreground">
                          {formatMetier(worker)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {worker.unite_production}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-tabular text-size-sm font-medium text-foreground">
                          {formatCurrency(getTaux(worker) || 0, enterprise?.devise)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {label(PAYMENT_TYPE_LABELS, worker.type_paiement)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex justify-center">
                        <span
                          className={cn(
                            'text-xs font-medium',
                            worker.actif ? 'text-success' : 'text-muted-foreground'
                          )}
                        >
                          {worker.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7 text-primary hover:bg-primary hover:text-primary-foreground"
                          onClick={() => setPaymentModal({ open: true, worker })}
                          title="Régler Salaire"
                        >
                          <Wallet size={14} />
                        </Button>
                        <CreateWorkerModal 
                          worker={worker} 
                          onWorkerCreated={refetch} 
                          mode="edit"
                        >
                           <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                             <Edit size={14} />
                           </Button>
                        </CreateWorkerModal>
                        {worker.actif ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(worker.id)}
                            title="Désactiver"
                          >
                            <Trash2 size={14} />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-success hover:bg-success/10"
                            onClick={() => handleReactivate(worker.id)}
                            title="Réactiver"
                          >
                            <RotateCcw size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {paymentModal.worker && (
        <WorkerPaymentModal
          worker={paymentModal.worker}
          projectId={selectedProjectId!}
          open={paymentModal.open}
          onOpenChange={(open) => setPaymentModal({ ...paymentModal, open })}
          onPaymentCreated={refetch}
        />
      )}
    </div>
  );
}
