'use client';

import React, { useEffect, useState } from 'react';
import {
  Truck,
  Loader2,
  Plus, Tag,
  Hash,
  Trash2,
  Edit,
  Search,
  RotateCcw,
} from 'lucide-react';
import { getEquipments, deleteEquipment, updateEquipmentStatus } from '@/lib/server/equipment.actions';
import { Equipment } from '@/types/equipment';
import { CreateEquipmentModal } from '@/components/dashboard/create-equipment-modal';
import { DeployEquipmentModal } from '@/components/dashboard/deploy-equipment-modal';
import { EmptyState } from '@/components/dashboard/empty-state';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function EquipementsPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const hasEquipments = equipments.length > 0;

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
        return { label: 'Disponible', color: 'text-success' };
      case 'en_service':
        return { label: 'En service', color: 'text-primary' };
      case 'en_transit':
        return { label: 'En transit', color: 'text-warning' };
      case 'en_maintenance':
        return { label: 'Maintenance', color: 'text-warning' };
      case 'hors_service':
        return { label: 'Hors service', color: 'text-destructive' };
      default:
        return { label: status, color: 'text-muted-foreground' };
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet équipement ?')) return;
    const result = await deleteEquipment(id);
    if (result.error) {
      alert(result.error);
    } else {
      fetchEquipments();
    }
  };

  const handleRelease = async (id: string) => {
    const result = await updateEquipmentStatus(id, 'disponible');
    if (result.error) {
      alert(result.error);
    } else {
      fetchEquipments();
    }
  };
  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-size-2xl font-medium text-foreground sm:text-size-3xl">Équipements</h1>
          <p className="hidden text-size-sm text-muted-foreground sm:block">
            Gestion du parc matériel et déploiements.
          </p>
        </div>
        <div className={cn("flex items-center gap-3", !hasEquipments && "hidden")}>
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
          <CreateEquipmentModal onEquipmentCreated={fetchEquipments} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mb-2 animate-spin text-primary" size={32} />
          <p className="text-xs font-medium">Chargement...</p>
        </div>
      ) : filteredEquipments.length === 0 ? (
        <Card className="border-border">
          <EmptyState
            icon={Truck}
            title={searchQuery && hasEquipments ? 'Aucun résultat' : 'Parc matériel vide'}
            description={
              searchQuery && hasEquipments
                ? 'Aucun équipement ne correspond à votre recherche.'
                : 'Enregistrez vos premiers engins et outils pour suivre leur déploiement sur les chantiers.'
            }
            action={
              <CreateEquipmentModal onEquipmentCreated={fetchEquipments}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un équipement
                </Button>
              </CreateEquipmentModal>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEquipments.map((equipment) => {
            const status = getStatusInfo(equipment.etat);
            return (
              <Card
                key={equipment.id}
                hoverable
                className="flex flex-col overflow-hidden border-border p-0"
                padding="none"
              >
                <div className="p-6">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="truncate text-size-lg font-medium text-foreground">
                      {equipment.nom}
                    </h3>
                    <span className={cn('shrink-0 text-xs font-medium', status.color)}>
                      {status.label}
                    </span>
                  </div>

                  <div className="space-y-1.5 border-t border-border pt-3">
                    <div className="flex items-center gap-2 text-size-sm text-foreground">
                      <Tag size={12} className="text-muted-foreground" />
                      <span className="truncate">{equipment.categorie}</span>
                    </div>
                    <div className="font-tabular flex items-center gap-2 text-xs text-muted-foreground">
                      <Hash size={11} />
                      <span className="truncate">
                        {equipment.numero_serie || 'N° de série non renseigné'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex gap-1">
                      <CreateEquipmentModal equipment={equipment} onEquipmentCreated={fetchEquipments}>
                        <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                          <Edit size={14} className="text-muted-foreground hover:text-primary" />
                        </Button>
                      </CreateEquipmentModal>
                      {equipment.etat !== 'disponible' && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7"
                          title="Marquer comme disponible"
                          onClick={() => handleRelease(equipment.id)}
                        >
                          <RotateCcw size={14} className="text-muted-foreground hover:text-success" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-destructive hover:bg-destructive/5" onClick={() => handleDelete(equipment.id)}>
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
