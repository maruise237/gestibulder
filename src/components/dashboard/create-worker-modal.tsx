'use client';

import React, { useState } from 'react';
import { createWorker, updateWorker } from '@/lib/server/worker.actions';
import { NewWorker, Worker } from '@/types/worker';
import {
  Loader2,
  Briefcase,
  UserPlus,
  Phone,
  ShieldCheck,
  Target,
  Ruler,
  Banknote,
  Edit,
  Plus,
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

const METIERS = [
  { label: 'Maçon', value: 'macon', unit: 'm² / m³' },
  { label: 'Ferrailleur', value: 'ferrailleur', unit: 'kg / tonne' },
  { label: 'Électricien', value: 'electricien', unit: 'point / ml' },
  { label: 'Plombier', value: 'plombier', unit: 'point / ml' },
  { label: 'Peintre', value: 'peintre', unit: 'm²' },
  { label: 'Manoeuvre', value: 'manoeuvre', unit: 'jour' },
  { label: 'Autre', value: 'autre', unit: 'unité' },
];

interface CreateWorkerModalProps {
  onWorkerCreated: () => void;
  worker?: Worker;
  mode?: 'create' | 'edit';
  trigger?: React.ReactNode;
  children?: React.ReactNode;
}

export function CreateWorkerModal({
  onWorkerCreated,
  worker,
  mode = 'create',
  trigger,
  children,
}: CreateWorkerModalProps) {
  const { selectedProjectId } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetier, setSelectedMetier] = useState(worker?.metier || METIERS[0].value);
  const [paymentType, setPaymentType] = useState<'journalier' | 'hebdomadaire' | 'mensuel'>(
    worker?.type_paiement || 'journalier'
  );

  const isEdit = mode === 'edit';

  const currentTaux =
    paymentType === 'journalier'
      ? worker?.taux_journalier
      : paymentType === 'hebdomadaire'
        ? worker?.salaire_hebdo
        : worker?.salaire_mensuel;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const metierObj = METIERS.find((m) => m.value === selectedMetier);

    const data: Partial<NewWorker> = {
      nom_complet: formData.get('nom_complet') as string,
      telephone: formData.get('telephone') as string,
      metier: selectedMetier,
      metier_custom:
        selectedMetier === 'autre' ? (formData.get('metier_custom') as string) : undefined,
      unite_production: metierObj?.unit || 'unité',
      type_paiement: paymentType,
      taux_journalier: paymentType === 'journalier' ? Number(formData.get('taux')) : undefined,
      salaire_hebdo: paymentType === 'hebdomadaire' ? Number(formData.get('taux')) : undefined,
      salaire_mensuel: paymentType === 'mensuel' ? Number(formData.get('taux')) : undefined,
      chantier_ids: selectedProjectId ? [selectedProjectId] : [],
    };

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
      <DialogContent className="max-h-[90vh] overflow-y-auto overflow-hidden border-none p-0  sm:max-w-[700px]">
        <DialogHeader className="bg-muted/30 border-b p-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground  rounded-md p-3 ">
              {isEdit ? <Edit size={24} strokeWidth={2.5} /> : <Briefcase size={24} strokeWidth={2.5} />}
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-semibold tracking-tight">
                {isEdit ? 'Modifier le Profil' : 'Ajouter un Ouvrier'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/70 text-xs font-medium tracking-widest uppercase">
                {isEdit ? `Édition de ${worker?.nom_complet}` : 'Nouvelle fiche personnel'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6 pt-4">
          {!selectedProjectId && !isEdit ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 mb-6">
              <ShieldCheck className="text-amber-600" size={20} />
              <p className="text-amber-700 text-xs font-bold">Note: Aucun chantier sélectionné. L'ouvrier sera créé sans affectation initiale.</p>
            </div>
          ) : !isEdit && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3 mb-6">
              <HardHat className="text-indigo-600" size={20} />
              <p className="text-indigo-700 text-xs font-bold">Affectation automatique au chantier actif.</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Section Identité */}
            <div className="space-y-6">
              <h3 className="text-muted-foreground flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase">
                <ShieldCheck size={14} className="text-primary" /> Détails Personnels
              </h3>
              <div className="space-y-2.5">
                <Label
                  htmlFor="nom_complet"
                  className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase"
                >
                  Nom Complet
                </Label>
                <Input
                  id="nom_complet"
                  name="nom_complet"
                  required
                  defaultValue={worker?.nom_complet}
                  placeholder="Ex: Amine Benali"
                  className="bg-background border-border focus-visible:ring-primary/20 h-9 rounded-md px-4 font-medium"
                />
              </div>
              <div className="space-y-2.5">
                <Label
                  htmlFor="telephone"
                  className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase"
                >
                  Numéro de Téléphone
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
                    className="bg-background border-border focus-visible:ring-primary/20 h-9 rounded-md pr-4 pl-12 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section Métier */}
            <div className="space-y-6">
              <h3 className="text-muted-foreground flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase">
                <Target size={14} className="text-primary" /> Profil Professionnel
              </h3>
              <div className="space-y-2.5">
                <Label className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                  Métier / Spécialité
                </Label>
                <Select value={selectedMetier} onValueChange={(val) => val && setSelectedMetier(val)}>
                  <SelectTrigger className="bg-background border-border focus:ring-primary/20 h-9 rounded-md px-4 font-medium">
                    <SelectValue placeholder="Choisir un métier" />
                  </SelectTrigger>
                  <SelectContent className="border-border rounded-md">
                    {METIERS.map((m) => (
                      <SelectItem
                        key={m.value}
                        value={m.value}
                        className="rounded-md py-3 font-medium"
                      >
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedMetier === 'autre' && (
                <div className="animate-in slide-in-from-top-2 space-y-2.5 duration-200">
                  <Label
                    htmlFor="metier_custom"
                    className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase"
                  >
                    Nom du métier personnalisé
                  </Label>
                  <Input
                    id="metier_custom"
                    name="metier_custom"
                    required
                    defaultValue={worker?.metier_custom}
                    placeholder="Ex: Étanchéité"
                    className="bg-background border-border focus-visible:ring-primary/20 h-9 rounded-md px-4 font-medium"
                  />
                </div>
              )}
              <div className="bg-muted border-border flex items-center gap-3 rounded-md border p-4">
                <div className="bg-background text-primary border-border rounded-md border p-2 shadow-sm">
                  <Ruler size={14} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-primary/60 mb-1.1 text-[9px] leading-none font-semibold tracking-widest uppercase">
                    Unité de Production
                  </p>
                  <p className="text-foreground text-sm font-semibold">
                    {METIERS.find((m) => m.value === selectedMetier)?.unit}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section Paiement */}
          <div className="space-y-6 border-t pt-8">
            <h3 className="text-muted-foreground flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase">
              <Banknote size={14} className="text-primary" /> Modèle de Rémunération
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2.5">
                <Label className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                  Cycle de paie
                </Label>
                <div className="bg-muted/30 grid grid-cols-3 gap-2 rounded-md border p-1">
                  {(['journalier', 'hebdomadaire', 'mensuel'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPaymentType(type)}
                      className={cn(
                        'h-8 rounded-md text-[10px] font-semibold tracking-widest uppercase transition-all active:scale-95',
                        paymentType === type
                          ? 'bg-primary text-primary-foreground  '
                          : 'text-muted-foreground hover:bg-muted/50'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2.5">
                <Label
                  htmlFor="taux"
                  className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase"
                >
                  Taux (
                  {paymentType === 'journalier'
                    ? 'Jour'
                    : paymentType === 'hebdomadaire'
                      ? 'Semaine'
                      : 'Mois'}
                  )
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
                    className="bg-background border-border focus-visible:ring-primary/20 h-9 rounded-md pr-12 pl-12 font-medium"
                  />
                  <span className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 text-[10px] font-semibold tracking-widest uppercase">
                    DA
                  </span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border-destructive/20 animate-in fade-in slide-in-from-top-2 flex items-center gap-3 rounded-xl border p-4">
              <div className="bg-destructive h-1.5 w-1.5 animate-pulse rounded-full" />
              <p className="text-destructive text-xs font-semibold tracking-widest uppercase">
                {error}
              </p>
            </div>
          )}

          <DialogFooter className="gap-3 pt-4 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-border hover:bg-muted/50 h-9 flex-1 rounded-md font-medium"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className=" h-9 flex-1 rounded-md font-medium "
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? 'Mise à jour...' : 'Enregistrement...'}
                </>
              ) : (
                isEdit ? 'Mettre à jour' : "Enregistrer l'Ouvrier"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
