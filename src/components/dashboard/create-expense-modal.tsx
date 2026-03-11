'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { addExpense } from '@/lib/server/expense.actions';
import { getWorkers } from '@/lib/server/worker.actions';
import { Loader2, Plus, Wallet, Calendar, HardHat, ReceiptText, Banknote, UserPlus, Check } from 'lucide-react';
import { Project } from '@/types/project';
import { Worker } from '@/types/worker';
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

  const fetchWorkers = useCallback(async () => {
    setIsLoadingWorkers(true);
    // Fetch all workers and filter them by project ID locally for robustness
    const { workers: allWorkers } = await getWorkers(1, 1000);
    if (allWorkers) {
      const filtered = (allWorkers as Worker[]).filter(w => w.chantier_ids?.includes(selectedChantier));
      setWorkers(filtered);
    }
    setIsLoadingWorkers(false);
  }, [selectedChantier]);

  useEffect(() => {
    if (selectedChantier && category === 'main_d_oeuvre') {
      fetchWorkers();
    }
  }, [selectedChantier, category, fetchWorkers]);

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

  const toggleWorker = (id: string) => {
    setSelectedWorkerIds(prev =>
      prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
    );
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

        <form onSubmit={handleSubmit} className="space-y-6 p-8 pt-6">
          <div className="grid gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="chantier_id"
                className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
              >
                <HardHat size={14} className="text-indigo-600" /> Affectation Chantier
              </Label>
              <select
                id="chantier_id"
                name="chantier_id"
                required
                value={selectedChantier}
                onChange={(e) => {
                  setSelectedChantier(e.target.value);
                  setSelectedWorkerIds([]); // Reset workers when project changes
                }}
                className="bg-zinc-50 border-zinc-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 h-12 w-full cursor-pointer appearance-none rounded-xl px-4 font-bold outline-none"
              >
                <option value="">Sélectionner un chantier</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
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
                  placeholder="Ex: Achat de ciment en gros"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="montant">
                    Montant ({enterprise?.devise || 'DA'})
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
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

              <div className="space-y-2">
                <Label htmlFor="chantier_id">Chantier concerné</Label>
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

              {category === 'main_d_oeuvre' && (
                <div className="space-y-2.5 animate-in fade-in slide-in-from-left-2 duration-300">
                  <Label className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                    <UserPlus size={14} className="text-indigo-600" /> Ouvrier(s)
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        type="button"
                        disabled={!selectedChantier || isLoadingWorkers}
                        className="bg-zinc-50 border-zinc-200 focus:border-indigo-600 h-12 w-full justify-between rounded-xl px-4 font-bold text-left overflow-hidden"
                      >
                        <span className="truncate">
                          {isLoadingWorkers ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : selectedWorkerIds.length > 0 ? (
                            `${selectedWorkerIds.length} sélectionné(s)`
                          ) : (
                            "Sélectionner"
                          )}
                        </span>
                        <Check className={cn("h-4 w-4 shrink-0 ml-2", selectedWorkerIds.length > 0 ? "text-indigo-600" : "text-zinc-300")} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0 rounded-xl" align="start">
                      <div className="max-h-[200px] overflow-y-auto p-2 space-y-1">
                        {workers.length === 0 ? (
                          <p className="p-2 text-[10px] font-bold text-muted-foreground uppercase text-center italic">
                            Aucun ouvrier trouvé
                          </p>
                        ) : (
                          workers.map((worker) => (
                            <label
                              key={worker.id}
                              className="flex items-center space-x-2 rounded-md p-2 hover:bg-zinc-100 transition-colors cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedWorkerIds.includes(worker.id)}
                                onCheckedChange={() => toggleWorker(worker.id)}
                              />
                              <span className="text-xs font-bold uppercase truncate">{worker.nom_complet}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
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
              disabled={mutation.isPending}
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
