'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { addExpense } from '@/lib/server/expense.actions';
import { getWorkersByProject } from '@/lib/server/worker.actions';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function CreateExpenseModal({
  projects,
  onExpenseCreated,
}: {
  projects: Project[];
  onExpenseCreated: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChantier, setSelectedChantier] = useState('');
  const [category, setCategory] = useState('');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);

  const fetchWorkers = useCallback(async (projectId: string) => {
    setIsLoadingWorkers(true);
    const { workers: fetchedWorkers } = await getWorkersByProject(projectId);
    setWorkers(fetchedWorkers || []);
    setIsLoadingWorkers(false);
  }, []);

  useEffect(() => {
    if (selectedChantier && category === 'main_d_oeuvre') {
      fetchWorkers(selectedChantier);
    }
  }, [selectedChantier, category, fetchWorkers]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: any = {
      chantier_id: formData.get('chantier_id') as string,
      libelle: formData.get('libelle') as string,
      montant: Number(formData.get('montant')),
      date: formData.get('date') as string,
      categorie: formData.get('categorie') as any,
      metadata: {
        worker_ids: selectedWorkerIds
      }
    };

    const result = await addExpense(data);

    if (result.error) {
      setError(result.error);
    } else {
      setIsOpen(false);
      onExpenseCreated();
      setSelectedWorkerIds([]);
    }
    setIsLoading(false);
  };

  const toggleWorker = (id: string) => {
    setSelectedWorkerIds(prev =>
      prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
    );
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
                onChange={(e) => setSelectedChantier(e.target.value)}
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

            <div className="grid grid-cols-2 gap-6">
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
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-zinc-50 border-zinc-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 h-12 w-full cursor-pointer appearance-none rounded-xl px-4 font-bold outline-none"
                >
                  <option value="">Choisir...</option>
                  <option value="materiaux">Matériaux</option>
                  <option value="main_d_oeuvre">Main d'œuvre</option>
                  <option value="transport">Transport</option>
                  <option value="autre">Autre</option>
                </select>
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
                        disabled={!selectedChantier || isLoadingWorkers}
                        className="bg-zinc-50 border-zinc-200 focus:border-indigo-600 h-12 w-full justify-between rounded-xl px-4 font-bold"
                      >
                        {isLoadingWorkers ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : selectedWorkerIds.length > 0 ? (
                          `${selectedWorkerIds.length} sélectionné(s)`
                        ) : (
                          "Sélectionner"
                        )}
                        <Check className={cn("h-4 w-4 ml-2", selectedWorkerIds.length > 0 ? "text-indigo-600" : "text-zinc-300")} />
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
                            <div
                              key={worker.id}
                              className="flex items-center space-x-2 rounded-md p-2 hover:bg-zinc-100 transition-colors cursor-pointer"
                              onClick={() => toggleWorker(worker.id)}
                            >
                              <Checkbox
                                checked={selectedWorkerIds.includes(worker.id)}
                                onCheckedChange={() => toggleWorker(worker.id)}
                              />
                              <span className="text-xs font-bold uppercase truncate">{worker.nom_complet}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>

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
              disabled={isLoading}
              className="bg-zinc-950 hover:bg-zinc-800 h-12 flex-1 rounded-xl font-bold text-white shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saisie...
                </>
              ) : (
                'Valider la Dépense'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
