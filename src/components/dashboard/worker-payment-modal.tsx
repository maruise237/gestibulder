'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getWorkerSalariesDue, createPayment } from '@/lib/server/payment.actions';
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

  const { data: dueData, isLoading } = useQuery({
    queryKey: ['worker-due', worker.id, projectId],
    queryFn: () => getWorkerSalariesDue(worker.id, projectId),
    enabled: open && !!worker.id && !!projectId,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => createPayment(data),
    onSuccess: () => {
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
      <DialogContent className="sm:max-w-[425px] rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
        <DialogHeader className="bg-indigo-600 p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-2xl p-3">
              <Wallet size={24} />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Régler Salaire</DialogTitle>
              <DialogDescription className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest opacity-80">
                {worker.nom_complet}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-2xl border border-border">
                  <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Dû Total</p>
                  <p className="text-lg font-black text-foreground">{formatCurrency(dueData?.totalDue || 0, enterprise?.devise)}</p>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Déjà Payé</p>
                  <p className="text-lg font-black text-emerald-700">{formatCurrency(dueData?.totalPaid || 0, enterprise?.devise)}</p>
                </div>
              </div>

              <div className="bg-indigo-50/30 p-6 rounded-2xl border-2 border-dashed border-indigo-100 text-center">
                 <p className="text-[10px] font-black text-indigo-600 uppercase mb-1 tracking-widest">Reste à payer</p>
                 <p className="text-3xl font-black text-indigo-700">{formatCurrency(dueData?.remaining || 0, enterprise?.devise)}</p>
                 <p className="mt-2 text-[9px] font-bold text-muted-foreground uppercase italic">{dueData?.daysPresent} jours de présence</p>
              </div>

              <form onSubmit={handlePay} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Montant du versement</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-12 pl-12 text-lg font-black rounded-xl border-2 focus:border-indigo-600"
                    />
                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  </div>
                </div>

                <DialogFooter className="pt-4">
                   <Button
                     type="submit"
                     disabled={mutation.isPending || !amount}
                     className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg"
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
