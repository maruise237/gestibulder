'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkersByProject, deleteWorker } from '@/lib/server/worker.actions';
import { useApp } from '@/lib/context/app-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Trash2, Edit, Users, HardHat, Loader2, Wallet } from 'lucide-react';
import { CreateWorkerModal } from '@/components/dashboard/create-worker-modal';
import { ExportModal } from '@/components/dashboard/export-modal';
import { WorkerPaymentModal } from '@/components/dashboard/worker-payment-modal';
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
          <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl uppercase">Ouvriers</h1>
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
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background pr-4 pl-9 text-xs font-medium transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 sm:w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <ExportModal />
            <CreateWorkerModal onWorkerCreated={refetch} />
          </div>
        </div>
      </div>

      {!selectedProjectId || selectedProjectId === 'all' ? (
        <Card className="border-2 border-dashed border-border bg-muted/30 py-12 text-center">
          <div className="mb-4 inline-flex rounded-xl bg-background p-4 text-muted-foreground shadow-sm">
            <HardHat size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-size-xl font-semibold tracking-tight text-foreground uppercase">Sélectionnez un chantier</h2>
          <p className="text-size-sm text-muted-foreground mt-1 uppercase font-bold">Veuillez choisir un chantier dans le menu supérieur pour voir les ouvriers affectés.</p>
        </Card>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mb-2 animate-spin text-primary" size={32} />
          <p className="text-xs font-medium uppercase tracking-widest">Chargement des effectifs...</p>
        </div>
      ) : workers.length === 0 ? (
        <Card className="border-2 border-dashed border-border bg-muted/30 py-20 text-center rounded-2xl">
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-background shadow-premium">
            <Users size={40} className="text-primary/20" />
            <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-premium animate-bounce">
              <Plus size={16} />
            </div>
          </div>
          <h2 className="mb-2 text-size-xl font-semibold tracking-tight text-foreground uppercase">
            Effectif vide
          </h2>
          <p className="mx-auto mb-10 max-w-sm text-size-sm font-medium text-muted-foreground italic uppercase">
            Il semble que personne n'ait encore été affecté à ce chantier. Ajoutez vos premiers ouvriers pour commencer le pointage.
          </p>
          <CreateWorkerModal onWorkerCreated={refetch}>
             <Button className="h-11 rounded-xl px-8 font-bold uppercase tracking-widest shadow-premium transition-all hover:scale-105 active:scale-95">
               Ajouter un ouvrier
             </Button>
          </CreateWorkerModal>
        </Card>
      ) : (
        <Card className="shadow-premium overflow-hidden border-border rounded-2xl" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                    Ouvrier
                  </th>
                  <th className="hidden px-4 py-3 text-[10px] font-black tracking-widest text-muted-foreground uppercase sm:table-cell">
                    Métier
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                    Rémunération
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {filteredWorkers.map((worker) => (
                  <tr
                    key={worker.id}
                    className="group transition-all duration-200 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-[10px] font-black text-foreground">
                          {worker.nom_complet.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate text-size-xs font-black text-foreground sm:text-size-sm uppercase">
                            {worker.nom_complet}
                          </span>
                          <span className="truncate text-[10px] font-bold text-muted-foreground sm:hidden uppercase">
                            {formatMetier(worker)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <div className="flex flex-col">
                        <span className="text-size-xs font-bold text-foreground uppercase">
                          {formatMetier(worker)}
                        </span>
                        <span className="text-[9px] font-black text-muted-foreground uppercase">
                          {worker.unite_production}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-size-xs font-black text-foreground sm:text-size-sm uppercase">
                          {formatCurrency(getTaux(worker) || 0, enterprise?.devise)}
                        </span>
                        <span className="text-[9px] font-black text-primary uppercase">
                          {worker.type_paiement}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[8px] font-black tracking-widest uppercase sm:text-[9px]',
                            worker.actif
                              ? 'bg-emerald-500/10 text-emerald-700'
                              : 'bg-rose-500/10 text-rose-700'
                          )}
                        >
                          {worker.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7 text-indigo-600 hover:bg-indigo-50"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
