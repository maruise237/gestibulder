'use client';

import React, { useState } from 'react';
import { addExpense } from '@/lib/server/expense.actions';
import { Loader2, Plus, Wallet, Banknote, Calendar, HardHat } from 'lucide-react';
import { Project } from '@/types/project';
import { NewExpense } from '@/types/expense';
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
    onSuccess: (result: any) => {
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        setIsOpen(false);
        setIsLoading(false);
        setSelectedCategory('');
        queryClient.invalidateQueries({ queryKey: ['budget-data'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
        if (onExpenseCreated) onExpenseCreated();
      }
    },
    onError: (err: any) => {
      setError(err.message || 'Une erreur est survenue');
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const data: NewExpense = {
      libelle: formData.get('libelle') as string,
      montant: Number(formData.get('montant')),
      categorie: selectedCategory as any,
      date: formData.get('date') as string,
      chantier_id: formData.get('chantier_id') as string,
      entreprise_id: enterprise?.id || '',
    };

    if (!data.categorie) {
      setError('Veuillez sélectionner une catégorie');
      setIsLoading(false);
      return;
    }

    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Dépense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="bg-muted/30 border-b p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground rounded-md p-2">
              <Wallet size={20} />
            </div>
            <div className="space-y-1">
              <DialogTitle>Nouvelle Dépense</DialogTitle>
              <DialogDescription>Gestion des flux financiers</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="libelle">Libellé de la dépense</Label>
                <Input
                  id="libelle"
                  name="libelle"
                  required
                  placeholder="Ex: Achat de ciment en gros"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="montant" className="flex items-center gap-2">
                    <Banknote size={14} className="text-primary" /> Montant ({enterprise?.devise || 'DA'})
                  </Label>
                  <Input
                    id="montant"
                    name="montant"
                    type="number"
                    required
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar size={14} className="text-primary" /> Date
                  </Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chantier_id" className="flex items-center gap-2">
                   <HardHat size={14} className="text-primary" /> Chantier concerné
                </Label>
                <Select name="chantier_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Catégorie</Label>
                <div className="bg-muted/30 grid grid-cols-2 gap-2 rounded-md border p-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setSelectedCategory(cat.value)}
                      className={cn(
                        'h-9 rounded-sm text-xs font-medium transition-all active:scale-95',
                        selectedCategory === cat.value
                          ? 'bg-primary text-primary-foreground shadow-sm'
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
