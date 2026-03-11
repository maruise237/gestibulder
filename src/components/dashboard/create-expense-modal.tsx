'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { addExpense } from '@/lib/server/expense.actions';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
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
  const { enterprise, selectedProjectId: contextProject } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChantier, setSelectedChantier] = useState<string>(contextProject || '');
  const [category, setCategory] = useState<string>('');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);

  const queryClient = useQueryClient();

  const fetchWorkers = useCallback(async () => {
    if (!selectedChantier) return;
    setIsLoadingWorkers(true);
    const result = await getWorkers(1, 1000);
    if (result.workers) {
      const filtered = (result.workers as Worker[]).filter(w => w.chantier_ids?.includes(selectedChantier));
      setWorkers(filtered);
    }
    setIsLoadingWorkers(false);
  }, [selectedChantier]);

  useEffect(() => {
    if (selectedChantier && category === 'main_d_oeuvre') {
      fetchWorkers();
    }
  }, [selectedChantier, category, fetchWorkers]);

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

    const data = {
      libelle: formData.get('libelle') as string,
      montant: Number(formData.get('montant')),
      categorie: category as any,
      date: formData.get('date') as string,
      chantier_id: selectedChantier,
      worker_ids: category === 'main_d_oeuvre' ? selectedWorkerIds : [],
    };

    if (!data.categorie) {
      setError('Veuillez sélectionner une catégorie');
      return;
    }
    if (!data.chantier_id) {
      setError('Veuillez sélectionner un chantier');
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

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="chantier_id">Chantier</Label>
              <Select value={selectedChantier} onValueChange={(val) => val && setSelectedChantier(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un chantier" />
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
              <Label htmlFor="libelle">Libellé</Label>
              <Input id="libelle" name="libelle" required placeholder="Ex: Achat de ciment" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="montant">Montant ({enterprise?.devise || 'DA'})</Label>
                <Input id="montant" name="montant" type="number" required placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categorie">Catégorie</Label>
              <Select value={category} onValueChange={(val) => val && setCategory(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {category === 'main_d_oeuvre' && (
              <div className="space-y-2">
                <Label>Ouvriers concernés</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {selectedWorkerIds.length > 0 ? `${selectedWorkerIds.length} sélectionné(s)` : "Sélectionner"}
                      <Check className={cn("h-4 w-4 opacity-50", selectedWorkerIds.length > 0 && "opacity-100")} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <div className="max-h-[200px] overflow-y-auto p-2">
                      {isLoadingWorkers ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : workers.length === 0 ? (
                        <p className="p-2 text-center text-xs text-muted-foreground">Aucun ouvrier trouvé pour ce chantier</p>
                      ) : (
                        workers.map((worker) => (
                          <div key={worker.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => toggleWorker(worker.id)}>
                            <Checkbox checked={selectedWorkerIds.includes(worker.id)} />
                            <span className="text-sm">{worker.nom_complet}</span>
                          </div>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button type="submit" isLoading={mutation.isPending}>Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
