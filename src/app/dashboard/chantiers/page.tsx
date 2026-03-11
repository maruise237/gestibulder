'use client';

import React, { useState } from 'react';
import { getProjects } from '@/lib/server/project.actions';
import {
  HardHat,
  Search,
  MapPin,
  Target,
  MoreVertical,
  ArrowUpRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/lib/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';

const CreateProjectModal = dynamic(() => import('@/components/dashboard/create-project-modal').then(mod => mod.CreateProjectModal), {
  loading: () => <Skeleton className="h-9 w-32 rounded-md" />,
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
    staleTime: 1000 * 60 * 5,
  });

  const filteredProjects = projects.filter(
    (p: any) =>
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
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl">Chantiers</h1>
          <p className="hidden text-size-xs font-medium text-muted-foreground sm:block">
            Suivi et gestion de vos projets de construction.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="group relative">
            <Search
              className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-indigo-600"
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
          <CreateProjectModal onProjectCreated={refetch} />
        </div>
      </div>

      {isLoading && projects.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex h-full flex-col overflow-hidden border-border p-0" padding="none">
              <div className="border-b border-border bg-muted/30 p-6">
                <Skeleton className="h-5 w-24 rounded-full mb-4" />
                <Skeleton className="h-6 w-48 rounded-md" />
              </div>
              <div className="flex-1 space-y-4 p-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
              <div className="p-6 pt-0">
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      ) : !isLoading && filteredProjects.length === 0 ? (
        <Card className="border-2 border-dashed border-border bg-muted/30 py-12 text-center sm:py-20">
          <div className="mb-4 inline-flex rounded-xl bg-background p-4 text-muted-foreground shadow-sm">
            <HardHat size={32} strokeWidth={1.5} />
          </div>
          <h2 className="mb-1 text-size-xl font-semibold tracking-tight text-foreground">
            Aucun projet
          </h2>
          <p className="mx-auto mb-6 max-w-sm text-size-sm font-medium text-muted-foreground">
            {searchQuery
              ? "Aucun résultat pour cette recherche."
              : 'Commencez par créer votre premier chantier.'}
          </p>
          <CreateProjectModal onProjectCreated={refetch} />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project: any) => (
            <Card
              key={project.id}
              hoverable
              className="group flex h-full flex-col overflow-hidden border-border p-0"
              padding="none"
            >
              <div className="border-b border-border bg-muted/30 p-4 sm:p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-[9px] font-semibold tracking-widest uppercase shadow-sm sm:text-[10px]',
                      getStatusStyle(project.statut)
                    )}
                  >
                    {getStatusLabel(project.statut)}
                  </div>
                  <button className="rounded-md border border-transparent p-1 text-muted-foreground transition-all hover:border-border hover:bg-background hover:text-primary">
                    <MoreVertical size={16} />
                  </button>
                </div>
                <h3 className="text-size-lg leading-tight font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-size-xl">
                  {project.nom}
                </h3>
              </div>

              <div className="flex-1 space-y-4 p-4 sm:p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <div className="rounded-md bg-background p-1.5 border border-border">
                      <MapPin size={14} className="text-muted-foreground group-hover:text-primary" />
                    </div>
                    <span className="truncate text-xs font-medium text-foreground">
                      {project.adresse || 'Adresse non renseignée'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <div className="rounded-md bg-background p-1.5 border border-border">
                      <Target size={14} className="text-muted-foreground group-hover:text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground">
                      Budget: {formatCurrency(project.budget_total, enterprise?.devise)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-end justify-between text-[9px] font-semibold tracking-widest uppercase text-muted-foreground">
                    <span>Avancement</span>
                    <span className="text-foreground">
                      {project.avancement_pct || 0}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-1000"
                      style={{ width: `${project.avancement_pct || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-auto p-4 pt-0 sm:p-6 sm:pt-0">
                <Link href={`/dashboard/chantiers/${project.id}`} className="w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-[10px] font-semibold uppercase tracking-widest"
                  >
                    Détails
                    <ArrowUpRight size={14} className="ml-2" />
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
