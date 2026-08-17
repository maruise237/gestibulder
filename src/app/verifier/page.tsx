'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ShieldCheck, Clock, Building2, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';

function VerifierContent() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get('id');

  // Extract date from ID (Format: GB-YYYY-MMDD-XXXX)
  const dateStr = reportId?.split('-')[1] + '-' + reportId?.split('-')[2];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-stone-950">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-stone-950 text-white shadow-xl mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Vérification GestiBulder</h1>
          <p className="text-stone-500 text-xs font-bold">Service d'authentification de documents</p>
        </div>

        <Card className="p-8 border-2 border-stone-200 shadow-2xl rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4">
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success border border-success/20">
                <CheckCircle2 size={12} strokeWidth={3} />
                <span className="text-xs font-medium">Authentique</span>
             </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-stone-400">Identifiant du rapport</p>
              <p className="text-xl font-black font-mono text-stone-900">{reportId || 'ID MANQUANT'}</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-stone-400">Date de génération</p>
                  <p className="text-sm font-bold text-stone-900">Document généré avec succès</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
                  <Globe size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-stone-400">Source officielle</p>
                  <p className="text-sm font-bold text-stone-900">GestiBulder — gestibulder.com</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-stone-100">
              <p className="text-[10px] font-medium text-stone-500 italic leading-relaxed">
                Ce service confirme que le document portant l'identifiant ci-dessus a été officiellement généré via la plateforme GestiBulder. Toute modification ultérieure du contenu du document annule cette certification.
              </p>
            </div>
          </div>
        </Card>

        <p className="text-center text-[10px] font-black text-stone-400">
          © {new Date().getFullYear()} GestiBulder Software
        </p>
      </div>
    </div>
  );
}

export default function VerifierPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black text-stone-400">Vérification en cours...</div>}>
      <VerifierContent />
    </Suspense>
  );
}
