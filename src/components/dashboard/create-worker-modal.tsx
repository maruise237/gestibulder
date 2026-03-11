'use client';

import React, { useState } from 'react';
import { createWorker, updateWorker } from '@/lib/server/worker.actions';
import {
  Loader2,
  Briefcase,
  Phone,
  Ruler,
  Banknote,
  ShieldCheck,
  Target,
  Edit,
  Plus,
} from 'lucide-react';
import { NewWorker, Worker } from '@/types/worker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/lib/context/app-context';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

const METIERS = [
  { value: 'macon', label: 'Maçon', unit: 'm² / ml' },
  { value: 'ferrailleur', label: 'Ferrailleur', unit: 'tonne' },
  { value: 'coffreur', label: 'Coffreur', unit: 'm²' },
  { value: 'electricien', label: 'Électricien', unit: 'point' },
  { value: 'plombier', label: 'Plombier', unit: 'point' },
  { value: 'peintre', label: 'Peintre', unit: 'm²' },
  { value: 'manoeuvre', label: 'Manoeuvre', unit: 'journée' },
  { value: 'autre', label: 'Autre...', unit: 'unité' },
];

export function CreateWorkerModal({
  worker,
  onWorkerCreated,
  children,
  mode,
}: {
  worker?: Worker;
  onWorkerCreated: () => void;
  children?: React.ReactNode;
  mode?: 'create' | 'edit';
}) {
  const isEdit = mode === 'edit' || !!worker;
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetier, setSelectedMetier] = useState<string>(worker?.metier || 'macon');
  const [paymentType, setPaymentType] = useState<'journalier' | 'hebdomadaire' | 'mensuel'>(
    worker?.type_paiement || 'journalier'
  );

  const isEdit = mode === 'edit' && worker;
  const { enterprise } = useApp();

  useEffect(() => {
    if (isOpen && isEdit) {
      setSelectedMetier(worker.metier);
      setPaymentType(worker.type_paiement);
    }
  }, [isOpen, isEdit, worker]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const metier = formData.get('metier_custom') || selectedMetier;

    const data: NewWorker = {
      nom_complet: formData.get('nom_complet') as string,
      telephone: formData.get('telephone') as string,
      metier: metier as string,
      type_paiement: paymentType,
      taux_journalier: paymentType === 'journalier' ? Number(formData.get('taux')) : undefined,
      salaire_hebdo: paymentType === 'hebdomadaire' ? Number(formData.get('taux')) : undefined,
      salaire_mensuel: paymentType === 'mensuel' ? Number(formData.get('taux')) : undefined,
      chantier_ids: worker?.chantier_ids || [],
      unite_production: METIERS.find(m => m.value === selectedMetier)?.unit || 'unité',
      actif: worker?.actif ?? true,
    };

    const result = isEdit
      ? await updateWorker(worker.id, data)
      : await createWorker(data as NewWorker);

    if (result.error) {
      setError(result.error);
    } else {
      setIsOpen(false);
      onWorkerCreated();
    }
    setIsLoading(false);
  };

  const formatMetier = (w: Worker) => {
    if (w.metier === 'autre') return w.metier_custom;
    return METIERS.find((m) => m.value === w.metier)?.label || w.metier;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 border border-transparent hover:border-zinc-200 hover:bg-white"
          >
            <Edit
              size={14}
              className="text-zinc-400 transition-colors group-hover:text-indigo-600"
            />
          </Button>
        ) : (
          <Button className="font-medium">
            <Plus className="h-4 w-4 md:mr-2" strokeWidth={3} />
            <span className="hidden md:inline">Ajouter un Ouvrier</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="bg-muted/30 border-b p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground rounded-md p-2">
              {isEdit ? <Edit size={20} /> : <Briefcase size={20} />}
            </div>
            <div className="space-y-1">
              <DialogTitle>
                {isEdit ? 'Modifier le Profil' : 'Ajouter un Ouvrier'}
              </DialogTitle>
              <DialogDescription>
                {isEdit ? `Édition de ${worker?.nom_complet || 'l\'ouvrier'}` : 'Nouvelle fiche personnel'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Section Identité */}
              <div className="space-y-4">
                <h3 className="text-muted-foreground flex items-center gap-2 text-[10px] font-semibold tracking-widest uppercase">
                  Détails Personnels
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="nom_complet">Nom Complet</Label>
                  <Input
                    id="nom_complet"
                    name="nom_complet"
                    required
                    defaultValue={worker?.nom_complet}
                    placeholder="Ex: Amine Benali"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Numéro de Téléphone</Label>
                  <div className="relative">
                    <Phone
                      className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
                      size={14}
                    />
                    <Input
                      id="telephone"
                      name="telephone"
                      defaultValue={worker?.telephone}
                      placeholder="05XX XX XX XX"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* Section Métier */}
              <div className="space-y-4">
                <h3 className="text-muted-foreground flex items-center gap-2 text-[10px] font-semibold tracking-widest uppercase">
                  Profil Professionnel
                </h3>
                <div className="space-y-2">
                  <Label>Métier / Spécialité</Label>
                  <Select value={selectedMetier} onValueChange={(val) => val && setSelectedMetier(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un métier" />
                    </SelectTrigger>
                    <SelectContent>
                      {METIERS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedMetier === 'autre' && (
                  <div className="space-y-2">
                    <Label htmlFor="metier_custom">Métier personnalisé</Label>
                    <Input
                      id="metier_custom"
                      name="metier_custom"
                      required
                      defaultValue={worker?.metier_custom}
                      placeholder="Ex: Étanchéité"
                    />
                  </div>
                )}
                <div className="bg-muted/30 border-border flex items-center gap-3 rounded-md border p-3">
                  <Ruler size={14} className="text-primary" />
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                      Unité de Production
                    </p>
                    <p className="text-sm font-medium">
                      {METIERS.find((m) => m.value === selectedMetier)?.unit}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Paiement */}
            <div className="mt-6 space-y-4 border-t pt-6">
              <h3 className="text-muted-foreground flex items-center gap-2 text-[10px] font-semibold tracking-widest uppercase">
                Modèle de Rémunération
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cycle de paie</Label>
                  <div className="bg-muted/30 grid grid-cols-3 gap-1 rounded-md border p-1">
                    {(['journalier', 'hebdomadaire', 'mensuel'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPaymentType(type)}
                        className={cn(
                          'h-8 rounded-sm text-[10px] font-semibold tracking-widest uppercase transition-all',
                          paymentType === type
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taux">
                    Taux (
                    {paymentType === 'journalier'
                      ? 'Jour'
                      : paymentType === 'hebdomadaire'
                        ? 'Semaine'
                        : 'Mois'}
                    )
                  </Label>
                  <div className="relative">
                    <Banknote
                      className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
                      size={14}
                    />
                    <Input
                      id="taux"
                      name="taux"
                      type="number"
                      required
                      defaultValue={currentTaux}
                      placeholder="0.00"
                      className="pr-10 pl-9"
                    />
                    <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-semibold uppercase">
                      DA
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border-destructive/20 mt-4 flex items-center gap-3 rounded-md border p-4 text-destructive text-xs">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="p-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? 'Mise à jour...' : 'Enregistrement...'}
                </>
              ) : (
                isEdit ? 'Mettre à jour' : "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
