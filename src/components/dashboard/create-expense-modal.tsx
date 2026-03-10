'use client';

import React, { useState } from 'react';
import { addExpense } from '@/lib/server/expense.actions';
import { Loader2, Plus, Wallet, Calendar, HardHat, ReceiptText, Banknote } from 'lucide-react';
import { NewExpense } from '@/types/expense';
import { Project } from '@/types/project';
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
import { useApp } from '@/lib/context/app-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const CATEGORIES = [
  { label: 'Matériaux', value: 'materiaux' },
  { label: "Main d'œuvre", value: 'main_d_oeuvre' },
  { label: 'Transport', value: 'transport' },
  { label: 'Divers', value: 'divers' },
];

export function CreateExpenseModal({
  projects,
  onExpenseCreated,
}: {
  projects: Project[];
  onExpenseCreated?: () => void;
}) {
  const { enterprise } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: addExpense,
    onMutate: async (newExpense) => {
      setIsLoading(true);
      setError(null);
      await queryClient.cancelQueries({ queryKey: ['budget-data'] });
      const previousData = queryClient.getQueryData(['budget-data']);

      queryClient.setQueryData(['budget-data'], (old: any) => ({
        ...old,
        expenses: [
          {
            id: 'temp-' + Date.now(),
            ...newExpense,
            date: new Date(newExpense.date).toISOString(),
          },
          ...(old?.expenses || []),
        ],
      }));

      return { previousData };
    },
    onError: (err: any, newExpense, context) => {
      queryClient.setQueryData(['budget-data'], context?.previousData);
      setError(err.message || 'Une erreur est survenue');
      setIsLoading(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-data'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    },
    onSuccess: (result: any) => {
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        setIsOpen(false);
        setIsLoading(false);
        setSelectedCategory('');
        if (onExpenseCreated) onExpenseCreated();
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: NewExpense = {
      libelle: formData.get('libelle') as string,
      montant: Number(formData.get('montant')),
      categorie: selectedCategory as any,
      date: formData.get('date') as string,
      chantier_id: formData.get('chantier_id') as string,
      entreprise_id: '',
    };

    if (!data.categorie) {
      setError('Veuillez sélectionner une catégorie');
      return;
    }

    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild><Button className="font-bold shadow-lg">
        <Plus className="mr-2 h-4 w-4" strokeWidth={3} />
        Nouvelle Dépense
      </Button></DialogTrigger>
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[500px]">
        <DialogHeader className="bg-muted/30 border-b p-8 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground shadow-primary/20 rounded-2xl p-3 shadow-lg">
              <Wallet size={24} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight">
                Nouvelle Dépense
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/70 text-xs font-bold tracking-widest uppercase">
                Gestion des flux financiers
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-8 pt-6">
          <div className="grid gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="libelle"
                className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
              >
                <ReceiptText size={14} className="text-primary" /> Libellé de la dépense
              </Label>
              <Input
                id="libelle"
                name="libelle"
                required
                placeholder="Ex: Achat de ciment en gros"
                className="bg-muted/20 border-muted focus-visible:ring-primary/20 h-12 rounded-xl px-4 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor="montant"
                  className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
                >
                  <Banknote size={14} className="text-primary" /> Montant ({enterprise?.devise || 'DA'})
                </Label>
                <Input
                  id="montant"
                  name="montant"
                  type="number"
                  required
                  placeholder="0.00"
                  className="bg-muted/20 border-muted focus-visible:ring-primary/20 h-12 rounded-xl px-4 font-bold"
                />
              </div>
              <div className="space-y-2.5">
                <Label
                  htmlFor="date"
                  className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
                >
                  <Calendar size={14} className="text-primary" /> Date
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="bg-muted/20 border-muted focus-visible:ring-primary/20 h-12 rounded-xl px-4 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="chantier_id"
                className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
              >
                <HardHat size={14} className="text-primary" /> Chantier concerné
              </Label>
              <Select name="chantier_id" required>
                <SelectTrigger className="bg-muted/20 border-muted focus:ring-primary/20 h-12 rounded-xl px-4 font-bold">
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent className="border-muted rounded-xl">
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="rounded-lg py-3 font-bold">
                      {p.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <Label className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                Catégorie
              </Label>
              <div className="bg-muted/30 grid grid-cols-2 gap-2 rounded-xl border p-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSelectedCategory(cat.value)}
                    className={cn(
                      'h-10 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all active:scale-95',
                      selectedCategory === cat.value
                        ? 'bg-primary text-primary-foreground shadow-primary/20 shadow-lg'
                        : 'text-muted-foreground hover:bg-muted/50'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
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
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
