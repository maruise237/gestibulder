'use client';

import React, { useEffect, useState } from 'react';
import {
  Truck,
  Loader2,
  Tag,
  Hash,
  Trash2,
  Edit,
  Search,
} from 'lucide-react';
import { getEquipments } from '@/lib/server/equipment.actions';
import { Equipment } from '@/types/equipment';
import { CreateEquipmentModal } from '@/components/dashboard/create-equipment-modal';
import { DeployEquipmentModal } from '@/components/dashboard/deploy-equipment-modal';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function EquipementsPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEquipments = async () => {
    setIsLoading(true);
    const result = await getEquipments();
    if (result.equipments) {
      setEquipments(result.equipments);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  const filteredEquipments = equipments.filter(
    (e) =>
      e.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.categorie.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.numero_serie?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusInfo = (status: Equipment['etat']) => {
    switch (status) {
      case 'disponible':
        return {
          label: 'Disponible',
          color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
        };
      case 'en_service':
        return {
          label: 'En Service',
          color: 'bg-primary/10 text-primary border-primary/20',
        };
      case 'en_transit':
        return {
          label: 'En Transit',
          color: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
        };
      case 'en_maintenance':
        return {
          label: 'Maintenance',
          color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
        };
      case 'hors_service':
        return {
          label: 'HS',
          color: 'bg-destructive/10 text-destructive border-destructive/20',
        };
      default:
        return { label: status, color: 'bg-muted text-muted-foreground border-border' };
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl">Équipements</h1>
          <p className="hidden text-size-xs font-medium text-muted-foreground sm:block">
            Gestion du parc matériel et déploiements.
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
          <CreateEquipmentModal onEquipmentCreated={fetchEquipments} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mb-2 animate-spin text-primary" size={32} />
          <p className="text-xs font-medium uppercase tracking-widest">Chargement...</p>
        </div>
      ) : filteredEquipments.length === 0 ? (
        <Card className="border-2 border-dashed border-border bg-muted/30 py-12 text-center">
          <div className="mb-4 inline-flex rounded-xl bg-background p-4 text-muted-foreground/50 shadow-sm">
            <Truck size={32} strokeWidth={1.5} />
          </div>
          <h2 className="mb-1 text-size-xl font-semibold tracking-tight text-foreground">
            Parc vide
          </h2>
          <p className="mx-auto mb-6 max-w-sm text-size-sm font-medium text-muted-foreground">
            Enregistrez vos premiers engins ou outils.
          </p>
          <CreateEquipmentModal onEquipmentCreated={fetchEquipments} />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEquipments.map((equipment) => {
            const status = getStatusInfo(equipment.etat);
            return (
              <Card
                key={equipment.id}
                hoverable
                className="group flex flex-col overflow-hidden border-border p-0"
                padding="none"
              >
                <div className="p-4 sm:p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="rounded-md bg-primary/10 p-2 text-primary">
                      <Truck size={18} />
                    </div>
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[8px] font-semibold tracking-widest uppercase sm:text-[9px]',
                        status.color
                      )}
                    >
                      {status.label}
                    </span>
                  </div>

                  <h3 className="truncate text-size-lg font-semibold tracking-tight text-foreground group-hover:text-primary">
                    {equipment.nom}
                  </h3>

                  <div className="mt-4 space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                    <div className="flex items-center gap-2 text-size-xs font-medium text-foreground">
                      <Tag size={12} className="text-primary" />
                      <span className="truncate">{equipment.categorie}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-semibold text-muted-foreground uppercase">
                      <Hash size={10} />
                      <span className="truncate font-mono">
                        {equipment.numero_serie || 'SN NON RENSEIGNÉ'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                        <Edit size={14} className="text-muted-foreground hover:text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-destructive hover:bg-destructive/5">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <DeployEquipmentModal equipment={equipment} onDeployed={fetchEquipments} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
