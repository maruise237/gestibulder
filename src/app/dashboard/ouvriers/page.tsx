'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkersByProject, deleteWorker } from '@/lib/server/worker.actions';
import { useApp } from '@/lib/context/app-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Search, Plus, Trash2, Edit, Users, HardHat, Loader2, Wallet } from 'lucide-react';
import { CreateWorkerModal } from '@/components/dashboard/create-worker-modal';
import { ExportModal } from '@/components/dashboard/export-modal';
import { WorkerPaymentModal } from '@/components/dashboard/worker-payment-modal';
import { EmptyState } from '@/components/dashboard/empty-state';
import { cn, formatCurrency } from '@/lib/utils';
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet ouvrier ?')) return;
    const result = await deleteWorker(id);
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
          <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl">Ouvriers</h1>
          <p className="hidden text-size-xs font-medium text-muted-foreground sm:block">
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
        <Card className="shadow-premium overflow-hidden border-border rounded-2xl" padding="none">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-4 py-3 text-[10px] font-black text-muted-foreground">
                    Ouvrier
                  </TableHead>
                  <TableHead className="hidden px-4 py-3 text-[10px] font-black text-muted-foreground sm:table-cell">
                    Métier
                  </TableHead>
                  <TableHead className="px-4 py-3 text-[10px] font-black text-muted-foreground">
                    Rémunération
                  </TableHead>
                  <TableHead className="px-4 py-3 text-center text-[10px] font-black text-muted-foreground">
                    Statut
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right text-[10px] font-black text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkers.map((worker) => (
                  <TableRow
                    key={worker.id}
                    className="group"
                  >
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-[10px] font-black text-foreground">
                          {worker.nom_complet.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate text-size-xs font-black text-foreground sm:text-size-sm">
                            {worker.nom_complet}
                          </span>
                          <span className="truncate text-[10px] font-bold text-muted-foreground sm:hidden">
                            {formatMetier(worker)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 sm:table-cell">
                      <div className="flex flex-col">
                        <span className="text-size-xs font-bold text-foreground">
                          {formatMetier(worker)}
                        </span>
                        <span className="text-[9px] font-black text-muted-foreground">
                          {worker.unite_production}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-size-xs font-black text-foreground sm:text-size-sm">
                          {formatCurrency(getTaux(worker) || 0, enterprise?.devise)}
                        </span>
                        <span className="text-[9px] font-black text-primary">
                          {worker.type_paiement}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex justify-center">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[8px] font-black sm:text-[9px]',
                            worker.actif
                              ? 'bg-success/10 text-success'
                              : 'bg-destructive/10 text-destructive'
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
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(worker.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
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
