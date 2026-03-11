'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HardHat, Coins, Sparkles, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { createProject } from '@/lib/server/project.actions';
import { updateEnterprise } from '@/lib/server/enterprise.actions';
import { CURRENCIES } from '@/lib/currencies';
import { useRouter } from 'next/navigation';

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [currency, setCurrency] = useState('DZD');
  const router = useRouter();

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = async () => {
    if (step === 1) {
      if (!projectName.trim()) return;
      setStep(2);
    } else if (step === 2) {
      setLoading(true);
      try {
        // Update enterprise currency
        await updateEnterprise({ devise: currency });
        // Create first project
        await createProject({
          nom: projectName,
          statut: 'en_cours',
          date_debut: new Date().toISOString().split('T')[0],
        });
        setStep(3);
      } catch (error) {
        console.error('Onboarding error:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Finish onboarding
      window.location.reload();
    }
  };

  return (
    <Card className="mx-auto max-w-lg border-2 border-primary/10 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="p-6 space-y-6">
        {/* Header & Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Bienvenue sur GestiBulder</h2>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Étape {step} sur {totalSteps}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <div className="min-h-[280px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <HardHat size={24} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project" className="text-base font-semibold">
                    Quel est le nom de votre premier chantier ?
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    C'est par ici que tout commence. Vous pourrez en ajouter d'autres plus tard.
                  </p>
                  <Input
                    id="project"
                    placeholder="Ex: Villa El Biar, Rénovation Centre..."
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    autoFocus
                    className="h-11 rounded-md"
                  />
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
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600">
                  <Coins size={24} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-base font-semibold">
                    Quelle devise utilisez-vous ?
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Nous utiliserons cette devise pour tous vos calculs de budget et de stock.
                  </p>
                  <Select value={currency} onValueChange={(val) => val && setCurrency(val)}>
                    <SelectTrigger id="currency" className="h-11 rounded-md">
                      <SelectValue placeholder="Sélectionnez une devise" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.label} ({c.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              className="flex-1 h-11"
            >
              Retour
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={loading || (step === 1 && !projectName.trim())}
            className="flex-1 h-11 font-semibold"
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
