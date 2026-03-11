'use client';

import React, { useState } from 'react';
import { addExpense } from '@/lib/server/expense.actions';
import { Loader2, Plus, Wallet, Calendar, HardHat, ReceiptText, Banknote, AlertCircle } from 'lucide-react';
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
import { useApp } from '@/lib/context/app-context';

export function CreateExpenseModal({
  onExpenseCreated,
}: {
  onExpenseCreated: () => void;
}) {
  const { selectedProjectId } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProjectId) {
        setError('Veuillez sélectionner un chantier dans la barre de navigation');
        return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: any = {
      chantier_id: selectedProjectId,
      libelle: formData.get('libelle') as string,
      montant: Number(formData.get('montant')),
      date: formData.get('date') as string,
      categorie: formData.get('categorie') as any,
    };

    const result = await addExpense(data);

    if (result.error) {
      setError(result.error);
    } else {
      setIsOpen(false);
      onExpenseCreated();
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95">
          <Plus className="h-4 w-4 md:mr-2" strokeWidth={3} />
          <span className="hidden md:inline">Nouvelle Dépense</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[500px]">
        <DialogHeader className="bg-zinc-950 text-white border-b p-8 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-2xl p-3 shadow-lg">
              <Wallet size={24} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight uppercase text-white">
                Saisir une Dépense
              </DialogTitle>
              <DialogDescription className="text-white/70 text-xs font-black tracking-widest uppercase">
                Enregistrement comptable
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-8 pt-6">
          {!selectedProjectId ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
              <AlertCircle className="text-amber-600" size={32} />
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-900">Aucun chantier sélectionné</p>
                <p className="text-xs text-amber-700">
                  Veuillez d'abord sélectionner un chantier dans la barre de navigation en haut de l'écran.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <div className="bg-indigo-600 text-white flex h-8 w-8 items-center justify-center rounded-lg shadow-sm">
                  <HardHat size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Chantier d'affectation</span>
                  <span className="text-sm font-black text-zinc-900">Utilisation du chantier actif</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor="libelle"
                  className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
                >
                  <ReceiptText size={14} className="text-indigo-600" /> Libellé / Objet
                </Label>
                <Input
                  id="libelle"
                  name="libelle"
                  required
                  placeholder="Ex: Achat 100 sacs de ciment"
                  className="bg-zinc-50 border-zinc-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 h-12 rounded-xl px-4 font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="montant"
                    className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
                  >
                    <Banknote size={14} className="text-indigo-600" /> Montant
                  </Label>
                  <Input
                    id="montant"
                    name="montant"
                    type="number"
                    required
                    placeholder="0.00"
                    className="bg-zinc-50 border-zinc-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 h-12 rounded-xl px-4 font-bold outline-none"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label
                    htmlFor="date"
                    className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
                  >
                    <Calendar size={14} className="text-indigo-600" /> Date
                  </Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="bg-zinc-50 border-zinc-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 h-12 rounded-xl px-4 font-bold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor="categorie"
                  className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
                >
                  <ReceiptText size={14} className="text-indigo-600" /> Catégorie
                </Label>
                <select
                  id="categorie"
                  name="categorie"
                  required
                  className="bg-zinc-50 border-zinc-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 h-12 w-full cursor-pointer appearance-none rounded-xl px-4 font-bold outline-none"
                >
                  <option value="materiaux">Matériaux</option>
                  <option value="main_d_oeuvre">Main d'œuvre</option>
                  <option value="transport">Transport</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-red-100 animate-in fade-in slide-in-from-top-2 flex items-center gap-3 rounded-xl border p-4">
              <div className="bg-red-600 h-1.5 w-1.5 animate-pulse rounded-full" />
              <p className="text-red-600 text-xs font-black tracking-widest uppercase">{error}</p>
            </div>
          )}

          <DialogFooter className="bg-zinc-50/30 -mx-8 -mb-8 mt-4 gap-3 p-8 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="h-12 flex-1 rounded-xl font-bold"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !selectedProjectId}
              className="bg-zinc-950 hover:bg-zinc-800 h-12 flex-1 rounded-xl font-bold text-white shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saisie...
                </>
              ) : (
                !selectedProjectId ? 'Choisir un chantier' : 'Valider la Dépense'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
