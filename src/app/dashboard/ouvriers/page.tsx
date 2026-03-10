'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Loader2,
  Phone,
  Briefcase,
  Trash2,
  Edit,
  Banknote,
  Ruler,
  MoreHorizontal,
  Search,
  Filter,
  ArrowUpRight,
  UserPlus,
} from 'lucide-react';
import { getWorkers } from '@/lib/server/worker.actions';
import { Worker } from '@/types/worker';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/lib/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { ExportModal } from '@/components/dashboard/export-modal';

const CreateWorkerModal = dynamic(() => import('@/components/dashboard/create-worker-modal').then(mod => mod.CreateWorkerModal), {
  loading: () => <Skeleton className="h-9 w-9 rounded-lg" />,
  ssr: false
});

export default function OuvriersPage() {
  const { enterprise } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['workers', page],
    queryFn: async () => {
      const result = await getWorkers(page, pageSize);
      if (result.error) throw new Error(result.error);
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const workers = data?.workers || [];
  const totalPages = data?.totalPages || 1;

  const filteredWorkers = workers.filter(
    (w) =>
      w.nom_complet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.metier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMetier = (worker: Worker) => {
    if (worker.metier === 'autre') return worker.metier_custom || 'Spécialiste';
    return worker.metier.charAt(0).toUpperCase() + worker.metier.slice(1).replace('_', ' ');
  };

  const getTaux = (worker: Worker) => {
    if (worker.type_paiement === 'journalier') return worker.taux_journalier;
    if (worker.type_paiement === 'hebdomadaire') return worker.salaire_hebdo;
    if (worker.type_paiement === 'mensuel') return worker.salaire_mensuel;
    return 0;
  };

  return (
    <div className="animate-in fade-in space-y-10 pb-20 duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-black tracking-tight text-zinc-950">Main d'œuvre</h1>
          <p className="font-bold tracking-tight text-zinc-500 italic">
            Gestion de vos équipes professionnelles et de leurs affectations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="group relative">
            <Search
              className="absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-indigo-600"
              size={18}
            />
            <input
              type="text"
              placeholder="Rechercher un ouvrier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pr-6 pl-12 text-[11px] font-black tracking-widest uppercase transition-all outline-none placeholder:text-zinc-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 md:w-72"
            />
          </div>
          <ExportModal />
          <CreateWorkerModal onWorkerCreated={refetch} />
        </div>
      </div>

      {isLoading && workers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-zinc-400">
          <Loader2 className="mb-4 animate-spin" size={40} />
          <p className="font-black tracking-tight">Accès aux dossiers du personnel...</p>
        </div>
      ) : !isLoading && filteredWorkers.length === 0 ? (
        <Card className="border-2 border-dashed border-zinc-100 bg-zinc-50/30 py-24 text-center">
          <div className="mb-6 inline-flex rounded-3xl bg-white p-6 text-zinc-300 shadow-sm">
            <Users size={48} strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-2xl font-black tracking-tight text-zinc-950">
            Aucun membre d'équipe
          </h2>
          <p className="mx-auto mb-10 max-w-sm font-bold tracking-tight text-zinc-500">
            {searchQuery
              ? "Nous n'avons trouvé aucun employé correspondant à votre recherche."
              : 'Commencez par ajouter vos ouvriers qualifiés au système.'}
          </p>
          <CreateWorkerModal onWorkerCreated={refetch} />
        </Card>
      ) : (
        <Card className="shadow-premium overflow-hidden border-none" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="px-8 py-5 text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
                    Membre d'équipe
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
                    Spécialisation
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
                    Rémunération
                  </th>
                  <th className="px-8 py-5 text-center text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
                    Statut
                  </th>
                  <th className="px-8 py-5 text-right text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-11 w-11 rounded-xl" />
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-32 rounded-md" />
                            <Skeleton className="h-3 w-24 rounded-md" />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24 rounded-md" />
                          <Skeleton className="h-3 w-20 rounded-md" />
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-20 rounded-md" />
                          <Skeleton className="h-5 w-24 rounded-md" />
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center">
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-9 w-9 rounded-lg" />
                          <Skeleton className="h-9 w-9 rounded-lg" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredWorkers.map((worker) => (
                  <tr
                    key={worker.id}
                    className="group transition-all duration-200 hover:bg-zinc-50/30"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-xs font-black text-zinc-900 shadow-sm transition-all duration-300 group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white">
                          {worker.nom_complet.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[15px] font-black tracking-tight text-zinc-950 transition-colors group-hover:text-indigo-600">
                            {worker.nom_complet}
                          </span>
                          <span className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-zinc-400">
                            <Phone size={10} className="text-indigo-500/50" />{' '}
                            {worker.telephone || 'Non renseigné'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black tracking-tight text-zinc-950">
                          {formatMetier(worker)}
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                          <Ruler size={10} className="text-indigo-500/50" />{' '}
                          {worker.unite_production}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black tracking-tight text-zinc-950">
                          {formatCurrency(getTaux(worker) || 0, enterprise?.devise)}
                        </span>
                        <span className="mt-1 w-fit rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-black tracking-widest text-indigo-600 uppercase shadow-sm shadow-indigo-50">
                          {worker.type_paiement}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        <span
                          className={cn(
                            'rounded-full border px-3 py-1 text-[10px] font-black tracking-widest uppercase shadow-sm',
                            worker.actif
                              ? 'border-emerald-100 bg-emerald-50 text-emerald-700 shadow-emerald-50'
                              : 'border-red-100 bg-red-50 text-red-700 shadow-red-50'
                          )}
                        >
                          {worker.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex translate-x-2 items-center justify-end gap-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                        <CreateWorkerModal 
                          worker={worker} 
                          onWorkerCreated={refetch} 
                          mode="edit"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 border border-transparent text-red-500 hover:border-red-100 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/30 px-8 py-4">
            <div className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
              Page {page} sur {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1 || isLoading}
                onClick={() => setPage(page - 1)}
                className="h-8 rounded-lg px-3 text-[10px] font-black uppercase"
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages || isLoading}
                onClick={() => setPage(page + 1)}
                className="h-8 rounded-lg px-3 text-[10px] font-black uppercase"
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
