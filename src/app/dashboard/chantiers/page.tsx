'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProjects } from '@/lib/server/project.actions';
import {
  HardHat,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
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
          <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl">Mes Chantiers</h1>
          <p className="hidden text-size-xs font-medium text-muted-foreground sm:block">
            Veuillez sélectionner un chantier dans le menu supérieur.
          </p>
        </div>
      </div>

      <Card className="border-2 border-dashed border-border bg-muted/30 py-12 text-center sm:py-20">
        <div className="mb-4 inline-flex rounded-xl bg-background p-4 text-muted-foreground shadow-sm">
          <HardHat size={32} strokeWidth={1.5} />
        </div>
        <h2 className="mb-1 text-size-xl font-semibold tracking-tight text-foreground">
          Sélecteur de chantier requis
        </h2>
        <p className="mx-auto mb-6 max-w-sm text-size-sm font-medium text-muted-foreground">
          Utilisez le sélecteur en haut de la page pour choisir un chantier ou en créer un nouveau.
        </p>
      </Card>
    </div>
  );
}
