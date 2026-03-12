'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { addExpense } from '@/lib/server/expense.actions';
import { NewExpense } from "@/types/expense";
import { getWorkers } from '@/lib/server/worker.actions';
import { Loader2, Plus, Wallet, HardHat, ReceiptText, UserPlus, Check } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/context/app-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

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
  const { enterprise, selectedProjectId: contextProject } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChantier, setSelectedChantier] = useState<string>(contextProject || '');
  const [category, setCategory] = useState<string>('');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);

  const queryClient = useQueryClient();
  const [selectedChantier, setSelectedChantier] = useState<string>("");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: (data: NewExpense) => addExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      onExpenseCreated?.();
      setIsOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  const resetForm = () => {
    setSelectedCategory('');
    setSelectedChantier('');
    setSelectedWorkerIds([]);
    setError(null);
  };

  const fetchWorkers = useCallback(async () => {
    if (!selectedChantier) return;
    setIsLoadingWorkers(true);
    const { workers: allWorkers } = await getWorkers(1, 1000);
    if (allWorkers) {
      const filtered = (allWorkers as Worker[]).filter(w => w.chantier_ids?.includes(selectedChantier));
      setWorkers(filtered);
    }
    setIsLoadingWorkers(false);
  }, [selectedChantier]);

  useEffect(() => {
    if (selectedChantier && selectedCategory === 'main_d_oeuvre') {
      fetchWorkers();
    }
  }, [selectedChantier, selectedCategory, fetchWorkers]);

  const mutation = useMutation({
    mutationFn: (data: any) => addExpense(data),
    onSuccess: (result) => {
      if (result.error) {
        setError(result.error);
      } else {
        setIsOpen(false);
        queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
        queryClient.invalidateQueries({ queryKey: ['budget-data'] });
        onExpenseCreated?.();
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!selectedCategory) {
      setError('Veuillez sélectionner une catégorie');
      return;
    }

    const data: NewExpense = {
      libelle: formData.get('libelle') as string,
      montant: Number(formData.get('montant')),
      categorie: category as any,
      date: formData.get('date') as string,
      chantier_id: formData.get('chantier_id') as string,
      entreprise_id: enterprise?.id || '',
    };

    mutation.mutate(data);
  };

  const toggleWorker = (id: string) => {
    setSelectedWorkerIds(prev =>
      prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
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
              <Label className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                <Wallet size={14} className="text-indigo-600" /> Catégorie
              </Label>
              <div className="bg-muted/30 grid grid-cols-2 gap-2 rounded-xl border p-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSelectedCategory(cat.value)}
                    className={cn(
                      "h-10 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all active:scale-95",
                      selectedCategory === cat.value
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

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
                  setSelectedWorkerIds([]);
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

            <div className="space-y-2">
              <Label htmlFor="libelle">Libellé</Label>
              <Input id="libelle" name="libelle" required placeholder="Ex: Achat de ciment" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="montant" className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                  <Banknote size={14} className="text-indigo-600" /> Montant ({enterprise?.devise || "DA"})
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
              <div className="space-y-2">
                <Label htmlFor="date" className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                  <Calendar size={14} className="text-indigo-600" /> Date
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="bg-zinc-50 border-zinc-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 h-12 rounded-xl px-4 font-bold outline-none"
                />
              </div>
            </div>

            {selectedCategory === "main_d_oeuvre" && (
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
            )}

            {error && (
              <p className="text-xs font-medium text-destructive">{error}</p>
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
              {mutation.isPending ? (
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
