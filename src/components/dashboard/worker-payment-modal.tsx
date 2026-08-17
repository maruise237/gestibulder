'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkerSalariesDue, createPayment } from '@/lib/server/paiement.actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Coins, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/lib/context/app-context';

export function WorkerPaymentModal({
  worker,
  projectId,
  onPaymentCreated,
  open,
  onOpenChange
}: {
  worker: any;
  projectId: string;
  onPaymentCreated: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { enterprise } = useApp();
  const [amount, setAmount] = useState('');
  const queryClient = useQueryClient();

  const { data: dueData, isLoading } = useQuery({
    queryKey: ['worker-due', worker.id, projectId],
    queryFn: () => getWorkerSalariesDue(worker.id, projectId),
    enabled: open && !!worker.id && !!projectId,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => createPayment(data),
    onSuccess: () => {
      // Invalidate relevant queries to update UI in real-time
      queryClient.invalidateQueries({ queryKey: ['budget-data', projectId] });
      queryClient.invalidateQueries({ queryKey: ['worker-due', worker.id, projectId] });
      queryClient.invalidateQueries({ queryKey: ['workers-by-project', projectId] });

      onPaymentCreated();
      onOpenChange(false);
      setAmount('');
    },
  });

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ouvrier_id: worker.id,
      chantier_id: projectId,
      montant: Number(amount),
      date_paiement: new Date().toISOString(),
      mode_paiement: 'especes',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden p-0 border-none shadow-2xl">
        <DialogHeader className="bg-success p-8 text-success-foreground">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3">
              <Wallet size={24} />
            </div>
            <div>
              <DialogTitle className="font-display text-xl font-medium text-success-foreground">Régler salaire</DialogTitle>
              <DialogDescription className="text-success-foreground text-xs opacity-80">
                {worker.nom_complet}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Dû total</p>
                  <p className="font-tabular text-lg font-medium text-foreground">{formatCurrency(dueData?.totalDue || 0, enterprise?.devise)}</p>
                </div>
                <div className="bg-success/10 p-4 border border-success/20">
                  <p className="text-xs text-success mb-1">Déjà payé</p>
                  <p className="font-tabular text-lg font-medium text-success">{formatCurrency(dueData?.totalPaid || 0, enterprise?.devise)}</p>
                </div>
              </div>

              <div className="bg-primary/5 p-6 border border-primary/20 text-center">
                 <p className="text-xs text-primary mb-1">Reste à payer</p>
                 <p className="font-tabular text-3xl font-medium text-primary">{formatCurrency(dueData?.remaining || 0, enterprise?.devise)}</p>
                 <p className="mt-2 text-xs text-muted-foreground">{dueData?.daysPresent} jours de présence</p>
              </div>

              <form onSubmit={handlePay} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Montant du versement</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="font-tabular h-12 pl-12 text-lg font-medium focus:border-primary"
                    />
                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  </div>
                </div>

                <DialogFooter className="pt-4">
                   <Button
                     type="submit"
                     disabled={mutation.isPending || !amount}
                     className="w-full h-12"
                   >
                     {mutation.isPending ? <Loader2 className="animate-spin" /> : 'Confirmer le paiement'}
                   </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
