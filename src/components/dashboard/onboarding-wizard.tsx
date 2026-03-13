'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Coins, Sparkles, Clock, ArrowRight, CheckCircle2, HardHat } from 'lucide-react';
import { createProject } from '@/lib/server/project.actions';
import { seedDemoData } from '@/lib/server/seed.actions';
import { updateEnterprise } from '@/lib/server/enterprise.actions';
import { CURRENCIES } from '@/lib/currencies';
import { cn } from '@/lib/utils';

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectBudget, setProjectBudget] = useState('');
  const [currency, setCurrency] = useState('DZD');
  const [useDemoData, setUseDemoData] = useState(true);

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setLoading(true);
      try {
        // 1. Update Enterprise Currency
        await updateEnterprise({ devise: currency });

        // 2. Create First Project
        const res = await createProject({
          nom: projectName,
          budget_total: Number(projectBudget) || 0,
          statut: 'en_cours',
        });

        if (res.project && useDemoData) {
          // 3. Optional Seed Data
          await seedDemoData(res.project.id);
        }
        setStep(3);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    } else {
      onComplete();
    }
  };

  return (
    <Card className="mx-auto max-w-lg border-none bg-card shadow-elevated rounded-3xl overflow-hidden">
      <div className="bg-indigo-600 p-8 text-white">
        <h2 className="text-xl font-black uppercase tracking-tight">Configuration Initiale</h2>
        <p className="text-indigo-100 text-xs font-semibold uppercase mt-1 tracking-widest opacity-80">
          Étape {step} sur 3
        </p>
        <div className="mt-6 flex gap-1.5">
          <div className={cn("h-1.5 flex-1 rounded-full bg-white/20 transition-all", step >= 1 && "bg-white")} />
          <div className={cn("h-1.5 flex-1 rounded-full bg-white/20 transition-all", step >= 2 && "bg-white")} />
          <div className={cn("h-1.5 flex-1 rounded-full bg-white/20 transition-all", step >= 3 && "bg-white")} />
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="min-h-[200px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Votre premier chantier</Label>
                  <Input
                    placeholder="Ex: Résidence Les Palmiers"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="h-12 text-lg font-bold rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Vous pourrez en ajouter d'autres plus tard.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Budget prévisionnel</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={projectBudget}
                      onChange={(e) => setProjectBudget(e.target.value)}
                      className="h-12 pl-12 text-lg font-bold rounded-xl"
                    />
                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Devise de l'entreprise</Label>
                  <Select value={currency} onValueChange={(val) => val && setCurrency(val)}>
                    <SelectTrigger className="h-12 rounded-xl font-bold">
                      <SelectValue placeholder="Choisir une devise" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.symbol} - {c.label} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div
                  onClick={() => setUseDemoData(!useDemoData)}
                  className={cn(
                    "cursor-pointer rounded-2xl border-2 p-4 transition-all flex items-center gap-4",
                    useDemoData ? "border-indigo-600 bg-indigo-50/50" : "border-border hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 shrink-0 flex items-center justify-center rounded-xl",
                    useDemoData ? "bg-indigo-600 text-white" : "bg-muted text-muted-foreground"
                  )}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">Mode Sandbox</p>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase leading-tight mt-0.5">Pré-remplir avec des données de test (ouvriers, stocks, dépenses)</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-4"
              >
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                      <CheckCircle2 size={40} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-foreground">Félicitations !</h3>
                  <p className="text-muted-foreground">
                    Votre espace de travail est prêt.
                  </p>
                </div>

                <Card className="bg-primary/5 border-none p-4 rounded-2xl">
                  <div className="flex items-center gap-4 text-left">
                    <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">Gain de temps estimé</p>
                      <p className="text-lg font-bold text-foreground">~4 heures / semaine</p>
                      <p className="text-[10px] text-muted-foreground italic">Sur la base d'une gestion manuelle classique</p>
                    </div>
                  </div>
                </Card>

                <p className="text-sm text-muted-foreground px-6">
                  Prêt à transformer la gestion de vos chantiers ?
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-3 pt-2">
          {step < 3 && step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={loading}
              className="flex-1 h-9"
            >
              Retour
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={loading || (step === 1 && !projectName.trim())}
            className="flex-1 h-9 font-semibold"
            rightIcon={step < 3 ? <ArrowRight size={18} /> : <Sparkles size={18} />}
            isLoading={loading}
          >
            {step === 3 ? "C'est parti !" : step === 2 ? 'Finaliser' : 'Continuer'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
