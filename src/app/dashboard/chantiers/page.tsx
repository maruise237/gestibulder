'use client';

import React, { useEffect, useState } from 'react';
import {
  HardHat,
  Loader2,
  MapPin,
  Calendar,
  MoreVertical,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  Target,
} from 'lucide-react';
import { getProjects } from '@/lib/server/project.actions';
import { Project } from '@/types/project';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TruncatedText } from '@/components/ui/truncated-text';
import Link from 'next/link';
import { useApp } from '@/lib/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';

const CreateProjectModal = dynamic(() => import('@/components/dashboard/create-project-modal').then(mod => mod.CreateProjectModal), {
  loading: () => <Skeleton className="h-10 w-32 rounded-lg" />,
  ssr: false
});

export default function ChantiersPage() {
  const { enterprise } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const result = await getProjects();
      if (result.error) throw new Error(result.error);
      return result.projects || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const filteredProjects = projects.filter(
    (p) =>
      p.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.adresse?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStyle = (statut: string) => {
    switch (statut) {
      case 'en_cours':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-50';
      case 'preparation':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-indigo-50';
      case 'termine':
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
      default:
        return 'bg-zinc-50 text-zinc-600 border-zinc-100';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'en_cours':
        return 'En Cours';
      case 'preparation':
        return 'Planification';
      case 'termine':
        return 'Terminé';
      default:
        return statut;
    }
  };

  return (
    <div className="animate-in fade-in space-y-10 pb-20 duration-500">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-black tracking-tight text-zinc-950">Chantiers</h1>
          <p className="font-bold tracking-tight text-zinc-500 italic">
            Suivi et gestion de vos projets de construction actifs.
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
              placeholder="Rechercher un projet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pr-6 pl-12 text-[11px] font-black tracking-widest uppercase transition-all outline-none placeholder:text-zinc-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 md:w-72"
            />
          </div>
          <CreateProjectModal onProjectCreated={refetch} />
        </div>
      </div>

      {isLoading && projects.length === 0 ? (
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex h-full flex-col overflow-hidden border-none p-0" padding="none">
              <div className="border-b border-zinc-100 bg-zinc-50/30 p-8 pb-6">
                <div className="mb-6 flex items-start justify-between">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-9 w-9 rounded-xl" />
                </div>
                <Skeleton className="h-8 w-48 rounded-md" />
              </div>
              <div className="flex-1 space-y-6 p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-4 w-48 rounded-md" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-4 w-32 rounded-md" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20 rounded-md" />
                    <Skeleton className="h-4 w-10 rounded-md" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
              <div className="p-8 pt-0">
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </Card>
          ))}
        </div>
      ) : !isLoading && filteredProjects.length === 0 ? (
        <Card className="border-2 border-dashed border-zinc-100 bg-zinc-50/30 py-24 text-center">
          <div className="mb-6 inline-flex rounded-3xl bg-white p-6 text-zinc-300 shadow-sm">
            <HardHat size={48} strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-2xl font-black tracking-tight text-zinc-950">
            Aucun projet trouvé
          </h2>
          <p className="mx-auto mb-10 max-w-sm font-bold tracking-tight text-zinc-500">
            {searchQuery
              ? "Nous n'avons trouvé aucun projet correspondant à votre recherche."
              : 'Votre liste de projets est vide. Créez votre premier chantier pour commencer.'}
          </p>
          <CreateProjectModal onProjectCreated={refetch} />
        </Card>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              hoverable
              className="group shadow-premium flex h-full flex-col overflow-hidden border-none p-0"
              padding="none"
            >
              {/* Card Header with Status */}
              <div className="border-b border-zinc-100 bg-zinc-50/30 p-8 pb-6">
                <div className="mb-6 flex items-start justify-between">
                  <div
                    className={cn(
                      'rounded-full border px-3 py-1 text-[10px] font-black tracking-widest uppercase shadow-sm',
                      getStatusStyle(project.statut)
                    )}
                  >
                    {getStatusLabel(project.statut)}
                  </div>
                  <button className="rounded-xl border border-transparent p-2 text-zinc-400 shadow-sm transition-all hover:border-zinc-100 hover:bg-white hover:text-indigo-600">
                    <MoreVertical size={18} />
                  </button>
                </div>
                <h3 className="text-2xl leading-tight font-black tracking-tight text-zinc-950 transition-colors group-hover:text-indigo-600">
                  <TruncatedText>
                  {project.nom}
                  </TruncatedText>
                </h3>
              </div>

              {/* Card Body */}
              <div className="flex-1 space-y-6 p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-zinc-500">
                    <div className="rounded-lg bg-zinc-50 p-2 transition-colors group-hover:bg-indigo-50">
                      <MapPin size={16} className="text-zinc-400 group-hover:text-indigo-500" />
                    </div>
                    <span className="text-sm font-bold tracking-tight text-zinc-600">
                      <TruncatedText>
                      {project.adresse || 'Adresse non renseignée'}
                      </TruncatedText>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-500">
                    <div className="rounded-lg bg-zinc-50 p-2 transition-colors group-hover:bg-indigo-50">
                      <Target size={16} className="text-zinc-400 group-hover:text-indigo-500" />
                    </div>
                    <span className="text-sm font-bold tracking-tight text-zinc-600">
                      Budget: {formatCurrency(project.budget_total, enterprise?.devise)}
                    </span>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                      Avancement
                    </span>
                    <span className="text-sm font-black text-zinc-950">
                      {project.avancement_pct || 0}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-1000 "
                      style={{ width: `${project.avancement_pct || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-auto p-8 pt-0">
                <Link href={`/dashboard/chantiers/${project.id}`} className="w-full">
                  <Button
                    variant="outline"
                    className="group/btn h-12 w-full rounded-xl border-zinc-200 text-[11px] font-black tracking-widest uppercase hover:border-indigo-600 hover:bg-white"
                    rightIcon={
                      <ArrowUpRight
                        size={16}
                        className="text-zinc-400 transition-colors group-hover/btn:text-indigo-600"
                      />
                    }
                  >
                    Détails du chantier
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
