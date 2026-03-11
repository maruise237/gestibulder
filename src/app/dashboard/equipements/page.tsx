'use client';

import React, { useEffect, useState } from 'react';
import {
  Truck,
  Loader2,
  Tag,
  Hash,
  Trash2,
  Edit,
  AlertCircle,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  Settings2,
} from 'lucide-react';
import { getEquipments, updateEquipmentStatus } from '@/lib/server/equipment.actions';
import { Equipment } from '@/types/equipment';
import { CreateEquipmentModal } from '@/components/dashboard/create-equipment-modal';
import { DeployEquipmentModal } from '@/components/dashboard/deploy-equipment-modal';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/lib/context/app-context';

export default function EquipementsPage() {
  const { enterprise } = useApp();
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
        return {
          label: 'Disponible',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-50',
        };
      case 'en_service':
        return {
          label: 'En Service',
          color: 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-indigo-50',
        };
      case 'en_transit':
        return {
          label: 'En Transit',
          color: 'bg-amber-50 text-amber-700 border-amber-100 shadow-amber-50',
        };
      case 'en_maintenance':
        return {
          label: 'Maintenance',
          color: 'bg-yellow-50 text-yellow-700 border-yellow-100 shadow-yellow-50',
        };
      case 'hors_service':
        return {
          label: 'Hors Service',
          color: 'bg-red-50 text-red-700 border-red-100 shadow-red-50',
        };
      default:
        return { label: status, color: 'bg-zinc-50 text-zinc-600 border-zinc-100' };
    }
  };

  return (
    <div className="animate-in fade-in space-y-10 pb-20 duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-black tracking-tight text-zinc-950">Parc Équipements</h1>
          <p className="font-bold tracking-tight text-zinc-500 italic">
            Gestion des engins, véhicules et outillage spécialisé du BTP.
          </p>
        </div>
        <div className={cn("flex items-center gap-3", !hasEquipments && "hidden")}>
          <div className="group relative">
            <Search
              className="absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-indigo-600"
              size={18}
            />
            <input
              type="text"
              placeholder="Rechercher un matériel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pr-6 pl-12 text-[11px] font-black tracking-widest uppercase transition-all outline-none placeholder:text-zinc-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 md:w-72"
            />
          </div>
          <CreateEquipmentModal onEquipmentCreated={fetchEquipments} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 text-zinc-400">
          <Loader2 className="mb-4 animate-spin" size={40} />
          <p className="font-black tracking-tight">Synchronisation de l'inventaire...</p>
        </div>
      ) : filteredEquipments.length === 0 ? (
        <Card className="border-2 border-dashed border-zinc-100 bg-zinc-50/30 py-24 text-center">
          <div className="mb-6 inline-flex rounded-3xl bg-white p-6 text-zinc-300 shadow-sm">
            <Truck size={48} strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-2xl font-black tracking-tight text-zinc-950">
            Aucun équipement trouvé
          </h2>
          <p className="mx-auto mb-10 max-w-sm font-bold tracking-tight text-zinc-500">
            {searchQuery && hasEquipments
              ? 'Aucun équipement ne correspond à votre recherche.'
              : 'Votre parc est vide. Enregistrez vos premiers engins et outils pour suivre leur déploiement sur les chantiers.'}
          </p>
          <CreateEquipmentModal onEquipmentCreated={fetchEquipments} />
        </Card>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredEquipments.map((equipment) => {
            const status = getStatusInfo(equipment.etat);
            return (
              <Card
                key={equipment.id}
                hoverable
                className="group flex flex-col overflow-hidden border-l-8 border-l-zinc-100 p-0 transition-all duration-500 hover:border-l-indigo-600"
                padding="none"
              >
                <div className="p-8">
                  <div className="mb-8 flex items-start justify-between">
                    <div className="rounded-2xl bg-indigo-600 p-3.5 text-white shadow-xl shadow-indigo-100 transition-transform group-hover:rotate-3">
                      <Truck size={24} strokeWidth={2.5} />
                    </div>
                    <span
                      className={cn(
                        'rounded-full border px-3 py-1 text-[10px] font-black tracking-widest uppercase shadow-sm',
                        status.color
                      )}
                    >
                      {status.label}
                    </span>
                  </div>

                  <h3 className="mb-2 text-2xl leading-tight font-black tracking-tight text-zinc-950 transition-colors group-hover:text-indigo-600">
                    {equipment.nom}
                  </h3>

                  <div className="mt-6 space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 transition-all group-hover:bg-white">
                    <div className="flex items-center gap-3 text-sm font-bold text-zinc-600">
                      <Tag size={14} className="shrink-0 text-indigo-500" />
                      <span className="truncate tracking-tight">{equipment.categorie}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                      <Hash size={12} className="shrink-0 text-indigo-500/50" />
                      <span className="truncate font-mono">
                        {equipment.numero_serie || 'S/N NON RENSEIGNÉ'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-zinc-100 pt-6">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 border border-transparent hover:border-zinc-200 hover:bg-white"
                      >
                        <Edit
                          size={16}
                          className="text-zinc-400 transition-colors group-hover:text-indigo-600"
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 border border-transparent text-red-500 hover:border-red-100 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
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
