'use client';

import React, { useState } from 'react';
import { createWorker, updateWorker } from '@/lib/server/worker.actions';
import {
  Loader2,
  Plus,
  Phone,
  Banknote,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { PAYMENT_TYPE_LABELS } from '@/lib/labels';
import { useApp } from '@/lib/context/app-context';
import { getCurrencyConfig } from '@/lib/currencies';
import { Worker } from '@/types/worker';

const METIERS = [
  { label: 'Chef de chantier', value: 'chef_chantier', unit: 'Forfait' },
  { label: 'Maçon', value: 'macon', unit: 'm²' },
  { label: 'Coffreur', value: 'coffreur', unit: 'm²' },
  { label: 'Ferrailleur', value: 'ferrailleur', unit: 'Tonne' },
  { label: 'Plombier', value: 'plombier', unit: 'Point' },
  { label: 'Électricien', value: 'electricien', unit: 'Point' },
  { label: 'Manœuvre', value: 'manoeuvre', unit: 'Jour' },
  { label: 'Peintre', value: 'peintre', unit: 'm²' },
  { label: 'Autre', value: 'autre', unit: 'Unité' },
];

export function CreateWorkerModal({
  children,
  worker,
  onWorkerCreated,
  mode = 'create',
}: {
  children?: React.ReactNode;
  worker?: Worker;
  onWorkerCreated: () => void;
  mode?: 'create' | 'edit';
}) {
  const { selectedProjectId, enterprise } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === 'edit';
  const [selectedMetier, setSelectedMetier] = useState(worker?.metier || 'macon');
  const [paymentType, setPaymentType] = useState<'journalier' | 'hebdomadaire' | 'mensuel'>(
    (worker?.type_paiement as any) || 'journalier'
  );

  const currentTaux = worker?.taux_journalier ?? worker?.salaire_hebdo ?? worker?.salaire_mensuel;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: any = {
      nom_complet: formData.get('nom_complet') as string,
      telephone: formData.get('telephone') as string,
      metier: selectedMetier,
      metier_custom: formData.get('metier_custom') as string,
      type_paiement: paymentType,
      unite_production: METIERS.find((m) => m.value === selectedMetier)?.unit,
      actif: true,
    };

    // Le montant saisi est toujours un taux journalier — le cycle de paie
    // ne détermine que la fréquence de versement, pas comment ce montant
    // est calculé. On écrit donc toujours dans taux_journalier et on vide
    // les anciens champs pour ne pas garder de données incohérentes.
    data.taux_journalier = Number(formData.get('taux'));
    data.salaire_hebdo = null;
    data.salaire_mensuel = null;

    if (!isEdit) {
      data.chantier_ids = [selectedProjectId];
    }

    const result = isEdit && worker ? await updateWorker(worker.id, data) : await createWorker(data);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setIsOpen(false);
      setIsLoading(false);
      onWorkerCreated();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un Ouvrier
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-none p-0 sm:max-w-[700px]">
        <DialogHeader className="border-b p-6 pb-4">
          <DialogTitle className="font-display text-2xl font-medium">
            {isEdit ? 'Modifier le profil' : 'Ajouter un ouvrier'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEdit ? `Édition de ${worker?.nom_complet}` : 'Nouvelle fiche personnel'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6 pt-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <h3 className="text-muted-foreground text-xs font-medium">
                Détails personnels
              </h3>
              <div className="space-y-2">
                <Label htmlFor="nom_complet">
                  Nom complet
                </Label>
                <Input
                  id="nom_complet"
                  name="nom_complet"
                  required
                  defaultValue={worker?.nom_complet}
                  placeholder="Ex: Amine Benali"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">
                  Numéro de téléphone
                </Label>
                <div className="group relative">
                  <Phone
                    className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-4 -translate-y-1/2 transition-colors"
                    size={16}
                  />
                  <Input
                    id="telephone"
                    name="telephone"
                    defaultValue={worker?.telephone}
                    placeholder="05XX XX XX XX"
                    className="pr-4 pl-12"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-muted-foreground text-xs font-medium">
                Profil professionnel
              </h3>
              <div className="space-y-2">
                <Label>
                  Métier / spécialité
                </Label>
                <Select value={selectedMetier} onValueChange={(val) => val && setSelectedMetier(val)}>
                  <SelectTrigger className="h-9 font-medium">
                    <SelectValue placeholder="Choisir un métier">
                      {(value: string) => METIERS.find((m) => m.value === value)?.label || value}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {METIERS.map((m) => (
                      <SelectItem
                        key={m.value}
                        value={m.value}
                        className="font-medium"
                      >
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedMetier === 'autre' && (
                <div className="animate-in slide-in-from-top-2 space-y-2 duration-200">
                  <Label htmlFor="metier_custom">
                    Nom du métier personnalisé
                  </Label>
                  <Input
                    id="metier_custom"
                    name="metier_custom"
                    required
                    defaultValue={worker?.metier_custom}
                    placeholder="Ex: Étanchéité"
                  />
                </div>
              )}
              <div className="border border-border flex items-center justify-between p-4">
                <p className="text-xs text-muted-foreground">
                  Unité de production
                </p>
                <p className="text-size-sm font-medium text-foreground">
                  {METIERS.find((m) => m.value === selectedMetier)?.unit}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 border-t pt-8">
            <h3 className="text-muted-foreground text-xs font-medium">
              Modèle de rémunération
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Cycle de versement
                </Label>
                <div className="bg-muted grid grid-cols-3 gap-1 border p-1">
                  {(['journalier', 'hebdomadaire', 'mensuel'] as const).map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={paymentType === type ? 'default' : 'ghost'}
                      onClick={() => setPaymentType(type)}
                      className="h-8 text-xs font-medium"
                    >
                      {PAYMENT_TYPE_LABELS[type]}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Détermine quand l'ouvrier est payé, pas le calcul du taux.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taux">
                  Taux journalier
                </Label>
                <div className="group relative">
                  <Banknote
                    className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-4 -translate-y-1/2 transition-colors"
                    size={16}
                  />
                  <Input
                    id="taux"
                    name="taux"
                    type="number"
                    required
                    defaultValue={currentTaux}
                    placeholder="0.00"
                    className="font-tabular pr-12 pl-12"
                  />
                  <span className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 text-xs">
                    {getCurrencyConfig(enterprise?.devise).symbol}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Montant dû pour une journée complète de présence.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border-destructive/20 flex items-center gap-3 rounded-md border p-4">
              <p className="text-destructive text-xs font-medium">
                {error}
              </p>
            </div>
          )}

          <DialogFooter className="gap-3 pt-4 sm:gap-0">
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
              disabled={isLoading || (!isEdit && !selectedProjectId)}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? 'Mise à jour...' : 'Enregistrement...'}
                </>
              ) : (
                isEdit ? 'Mettre à jour' : "Enregistrer l'ouvrier"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
