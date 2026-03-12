'use client';

import React, { useState } from 'react';
import { getWorkers } from '@/lib/server/worker.actions';
import {
  Users,
  Search,
  Trash2,
  Loader2,
  Edit,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/lib/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { CreateWorkerModal } from '@/components/dashboard/create-worker-modal';
import { Worker } from '@/types/worker';
import { ExportModal } from '@/components/dashboard/export-modal';

export default function OuvriersPage() {
  const { enterprise, selectedProjectId } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['workers', page],
    queryFn: async () => {
      const result = await getWorkers(page, itemsPerPage);
      if (result.error) throw new Error(result.error);
      return result;
    },
    staleTime: 1000 * 60 * 5,
  });

  const allWorkers = data?.workers || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  const workers = !selectedProjectId || selectedProjectId === 'all'
    ? allWorkers
    : allWorkers.filter(w => w.chantier_ids?.includes(selectedProjectId));

  const filteredWorkers = workers.filter(w =>
    w.nom_complet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMetier = (worker: Worker) => {
    return worker.metier === 'autre' ? worker.metier_custom : worker.metier;
  };

  const getTaux = (worker: Worker) => {
    switch (worker.type_paiement) {
      case 'journalier':
        return worker.taux_journalier;
      case 'hebdomadaire':
        return worker.salaire_hebdo;
      case 'mensuel':
        return worker.salaire_mensuel;
      default:
        return 0;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl">Ouvriers</h1>
          <p className="hidden text-size-xs font-medium text-muted-foreground sm:block">
            Gestion de vos effectifs et de la rémunération.
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

      {isLoading && allWorkers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mb-2 animate-spin text-primary" size={32} />
          <p className="text-xs font-medium uppercase tracking-widest">Chargement...</p>
        </div>
      ) : !isLoading && workers.length === 0 ? (
        <Card className="border-2 border-dashed border-border bg-muted/30 py-12 text-center">
          <div className="mb-4 inline-flex rounded-xl bg-background p-4 text-muted-foreground/50 shadow-sm">
            <Users size={32} strokeWidth={1.5} />
          </div>
          <h2 className="mb-1 text-size-xl font-semibold tracking-tight text-foreground">
            Aucun ouvrier
          </h2>
          <p className="mx-auto mb-6 max-w-sm text-size-sm font-medium text-muted-foreground">
             {selectedProjectId && selectedProjectId !== 'all'
                ? "Aucun ouvrier n'est affecté au chantier sélectionné."
                : "Commencez par ajouter votre premier ouvrier."}
          </p>
          <CreateWorkerModal onWorkerCreated={refetch} />
        </Card>
      ) : (
        <Card className="shadow-premium overflow-hidden border-border" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    Ouvrier
                  </th>
                  <th className="hidden px-4 py-3 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase sm:table-cell">
                    Métier
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    Rémunération
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
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
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-[10px] font-semibold text-foreground">
                          {worker.nom_complet.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate text-size-xs font-semibold text-foreground sm:text-size-sm">
                            {worker.nom_complet}
                          </span>
                          <span className="truncate text-[10px] text-muted-foreground sm:hidden">
                            {formatMetier(worker)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <div className="flex flex-col">
                        <span className="text-size-xs font-medium text-foreground">
                          {formatMetier(worker)}
                        </span>
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase">
                          {worker.unite_production}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-size-xs font-semibold text-foreground sm:text-size-sm">
                          {formatCurrency(getTaux(worker) || 0, enterprise?.devise)}
                        </span>
                        <span className="text-[9px] font-semibold text-primary uppercase">
                          {worker.type_paiement}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[8px] font-semibold tracking-widest uppercase sm:text-[9px]',
                            worker.actif
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700'
                              : 'border-destructive/20 bg-destructive/10 text-destructive'
                          )}
                        >
                          {worker.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
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

          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-3">
            <div className="text-[9px] font-semibold tracking-widest text-muted-foreground uppercase sm:text-[10px]">
              Page {page} / {totalPages || 1}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1 || isLoading}
                onClick={() => setPage(page - 1)}
                className="h-7 rounded-md px-2 text-[9px] font-semibold uppercase sm:h-8 sm:px-3 sm:text-[10px]"
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages || isLoading}
                onClick={() => setPage(page + 1)}
                className="h-7 rounded-md px-2 text-[9px] font-semibold uppercase sm:h-8 sm:px-3 sm:text-[10px]"
              >
                Suivant
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
