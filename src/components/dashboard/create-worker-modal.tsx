'use client';

import React, { useState, useEffect } from 'react';
import { createWorker, updateWorker } from '@/lib/server/worker.actions';
import {
  Loader2,
  Plus,
  Briefcase,
  Phone,
  Banknote,
  Ruler,
  ShieldCheck,
  Target,
  Edit,
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
import { cn } from '@/lib/utils';

const METIERS = [
  { label: 'Ferrailleur (kg)', value: 'ferrailleur', unit: 'kg' },
  { label: 'Maçon (m³)', value: 'macon', unit: 'm³' },
  { label: 'Coffreur (m²)', value: 'coffreur', unit: 'm²' },
  { label: 'Électricien (points)', value: 'electricien', unit: 'points' },
  { label: 'Carreleur (m²)', value: 'carreleur', unit: 'm²' },
  { label: 'Conducteur engins (h)', value: 'conducteur_engins', unit: 'h/machine' },
  { label: 'Conducteur PL (voyages)', value: 'conducteur_pl', unit: 'voyages' },
  { label: 'Peintre (m²)', value: 'peintre', unit: 'm²' },
  { label: 'Plombier (points)', value: 'plombier', unit: 'points' },
  { label: 'Manoeuvre (jour)', value: 'manoeuvre', unit: 'Journée' },
  { label: 'Autre (personnalisé)', value: 'autre', unit: 'unité' },
];

interface CreateWorkerModalProps {
  onWorkerCreated: () => void;
  worker?: Worker;
  mode?: 'create' | 'edit';
}

export function CreateWorkerModal({
  onWorkerCreated,
  worker,
  mode = 'create',
}: CreateWorkerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetier, setSelectedMetier] = useState(worker?.metier || METIERS[0].value);
  const [paymentType, setPaymentType] = useState<'journalier' | 'hebdomadaire' | 'mensuel'>(
    worker?.type_paiement || 'journalier'
  );

  const isEdit = mode === 'edit' && worker;

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
    };

    let result;
    if (isEdit) {
      result = await updateWorker(worker.id, data);
    } else {
      result = await createWorker({ ...data, chantier_ids: [], actif: true });
    }

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setIsOpen(false);
      setIsLoading(false);
      onWorkerCreated();
    }
  };

  const currentTaux = isEdit
    ? worker.type_paiement === 'journalier'
      ? worker.taux_journalier
      : worker.type_paiement === 'hebdomadaire'
        ? worker.salaire_hebdo
        : worker.salaire_mensuel
    : undefined;

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
          <Button className="font-bold shadow-lg">
            <Plus className="mr-2 h-4 w-4" strokeWidth={3} />
            Ajouter un Professionnel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[700px]">
        <DialogHeader className="bg-muted/30 border-b p-8 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground shadow-primary/20 rounded-2xl p-3 shadow-lg">
              {isEdit ? <Edit size={24} strokeWidth={2.5} /> : <Briefcase size={24} strokeWidth={2.5} />}
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight">
                {isEdit ? 'Modifier le Profil' : 'Recrutement Ouvrier'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/70 text-xs font-bold tracking-widest uppercase">
                {isEdit ? `Édition de ${worker.nom_complet}` : 'Nouvelle fiche personnel'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 p-8 pt-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Section Identité */}
            <div className="space-y-6">
              <h3 className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase">
                <ShieldCheck size={14} className="text-primary" /> Détails Personnels
              </h3>
              <div className="space-y-2.5">
                <Label
                  htmlFor="nom_complet"
                  className="text-muted-foreground text-[10px] font-black tracking-widest uppercase"
                >
                  Nom Complet
                </Label>
                <Input
                  id="nom_complet"
                  name="nom_complet"
                  required
                  defaultValue={worker?.nom_complet}
                  placeholder="Ex: Amine Benali"
                  className="bg-muted/20 border-muted focus-visible:ring-primary/20 h-12 rounded-xl px-4 font-bold"
                />
              </div>
              <div className="space-y-2.5">
                <Label
                  htmlFor="telephone"
                  className="text-muted-foreground text-[10px] font-black tracking-widest uppercase"
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
                    className="bg-muted/20 border-muted focus-visible:ring-primary/20 h-12 rounded-xl pr-4 pl-12 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Section Métier */}
            <div className="space-y-6">
              <h3 className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase">
                <Target size={14} className="text-primary" /> Profil Professionnel
              </h3>
              <div className="space-y-2.5">
                <Label className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                  Métier / Spécialité
                </Label>
                <Select value={selectedMetier} onValueChange={setSelectedMetier}>
                  <SelectTrigger className="bg-muted/20 border-muted focus:ring-primary/20 h-12 rounded-xl px-4 font-bold">
                    <SelectValue placeholder="Choisir un métier" />
                  </SelectTrigger>
                  <SelectContent className="border-muted rounded-xl">
                    {METIERS.map((m) => (
                      <SelectItem
                        key={m.value}
                        value={m.value}
                        className="rounded-lg py-3 font-bold"
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
                    className="text-muted-foreground text-[10px] font-black tracking-widest uppercase"
                  >
                    Nom du métier personnalisé
                  </Label>
                  <Input
                    id="metier_custom"
                    name="metier_custom"
                    required
                    defaultValue={worker?.metier_custom}
                    placeholder="Ex: Étanchéité"
                    className="bg-muted/20 border-muted focus-visible:ring-primary/20 h-12 rounded-xl px-4 font-bold"
                  />
                </div>
              )}
              <div className="bg-primary/5 border-primary/10 flex items-center gap-3 rounded-2xl border p-4">
                <div className="bg-background text-primary border-primary/10 rounded-lg border p-2 shadow-sm">
                  <Ruler size={14} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-primary/60 mb-1.1 text-[9px] leading-none font-black tracking-widest uppercase">
                    Unité de Production
                  </p>
                  <p className="text-foreground text-sm font-black">
                    {METIERS.find((m) => m.value === selectedMetier)?.unit}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section Paiement */}
          <div className="space-y-6 border-t pt-8">
            <h3 className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase">
              <Banknote size={14} className="text-primary" /> Modèle de Rémunération
            </h3>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-2.5">
                <Label className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                  Cycle de paie
                </Label>
                <div className="bg-muted/30 grid grid-cols-3 gap-2 rounded-xl border p-1">
                  {(['journalier', 'hebdomadaire', 'mensuel'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPaymentType(type)}
                      className={cn(
                        'h-10 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all active:scale-95',
                        paymentType === type
                          ? 'bg-primary text-primary-foreground shadow-primary/20 shadow-lg'
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
                  className="text-muted-foreground text-[10px] font-black tracking-widest uppercase"
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
                    className="bg-muted/20 border-muted focus-visible:ring-primary/20 h-12 rounded-xl pr-12 pl-12 font-bold"
                  />
                  <span className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 text-[10px] font-black tracking-widest uppercase">
                    DA
                  </span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border-destructive/20 animate-in fade-in slide-in-from-top-2 flex items-center gap-3 rounded-xl border p-4">
              <div className="bg-destructive h-1.5 w-1.5 animate-pulse rounded-full" />
              <p className="text-destructive text-xs font-black tracking-widest uppercase">
                {error}
              </p>
            </div>
          )}

          <DialogFooter className="gap-3 pt-4 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-muted hover:bg-muted/50 h-12 flex-1 rounded-xl font-bold"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="shadow-primary/20 h-12 flex-1 rounded-xl font-bold shadow-lg"
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
