'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProjects } from '@/lib/server/project.actions';
import {
  HardHat,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useApp } from '@/lib/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';

export default function ChantiersPage() {
  const { selectedProjectId } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== 'all') {
      router.push(`/dashboard/chantiers/${selectedProjectId}`);
    }
  }, [selectedProjectId, router]);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const result = await getProjects();
      if (result.error) throw new Error(result.error);
      return result.projects || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-48 border-border p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-size-2xl font-medium text-foreground sm:text-size-3xl">Mes chantiers</h1>
          <p className="hidden text-size-sm text-muted-foreground sm:block">
            Veuillez sélectionner un chantier dans le menu supérieur.
          </p>
        </div>
      </div>

      <Card className="border-border">
        <EmptyState
          icon={HardHat}
          title="Sélecteur de chantier requis"
          description="Utilisez le sélecteur en haut de la page pour choisir un chantier ou en créer un nouveau."
        />
      </Card>
    </div>
  );
}
