'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/lib/server/project.actions';
import { useApp } from '@/lib/context/app-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { HardHat, Building2, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateProjectModal } from './create-project-modal';

export function ProjectSelector() {
  const { selectedProjectId, setSelectedProjectId } = useApp();
  const [isAutoOpen, setIsAutoOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await getProjects();
      if (res.error) throw new Error(res.error);
      return res.projects || [];
    }
  });

  const projects = data || [];
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  useEffect(() => {
    if (!isLoading) {
      if (projects.length === 0) {
        setIsAutoOpen(true);
      } else if (projects.length === 1 && !selectedProjectId) {
        setSelectedProjectId(projects[0].id);
      }
    }
  }, [isLoading, projects, selectedProjectId, setSelectedProjectId]);

  return (
    <>
      <CreateProjectModal
        open={isAutoOpen}
        onOpenChange={setIsAutoOpen}
        onProjectCreated={() => setIsAutoOpen(false)}
        trigger={null}
      />

      <div className="flex items-center gap-2" data-tour="project-selector">
        <Select
          value={selectedProjectId || ''}
          onValueChange={(val) => setSelectedProjectId(val || null)}
        >
          <SelectTrigger
            className={cn(
              "h-9 min-w-[160px] max-w-[240px] gap-2 rounded-lg border-zinc-200 bg-white px-3 shadow-sm transition-all hover:bg-zinc-50",
              !selectedProjectId && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md",
                selectedProjectId ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-500"
              )}>
                {selectedProjectId ? <HardHat size={12} /> : <LayoutGrid size={12} />}
              </div>
              <span className="truncate text-xs font-semibold uppercase tracking-widest">
                {selectedProject ? selectedProject.nom : 'Choisir un chantier'}
              </span>
            </div>
          </SelectTrigger>

          <SelectContent align="start" className="w-[280px]">
            <SelectGroup>
              <SelectLabel>Mes Chantiers</SelectLabel>
              {isLoading ? (
                <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                  Chargement...
                </div>
              ) : projects.length === 0 ? (
                <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                  Aucun chantier trouvé
                </div>
              ) : (
                projects.map((project) => (
                  <SelectItem key={project.id} value={project.id} className="py-2.5">
                    <div className="flex items-center gap-2" data-tour="project-selector">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                        <Building2 size={16} />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate font-medium">{project.nom}</span>
                        <span className="truncate text-[10px] text-zinc-500">{project.adresse || 'Sans adresse'}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
