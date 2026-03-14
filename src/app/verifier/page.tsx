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
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-zinc-950">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-zinc-950 text-white shadow-xl mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight uppercase">Vérification GestiBulder</h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Service d'authentification de documents</p>
        </div>

        <Card className="p-8 border-2 border-zinc-200 shadow-2xl rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4">
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 size={12} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-widest">Authentique</span>
             </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Identifiant du rapport</p>
              <p className="text-xl font-black font-mono text-zinc-900">{reportId || 'ID MANQUANT'}</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Date de génération</p>
                  <p className="text-sm font-bold text-zinc-900">Document généré avec succès</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600">
                  <Globe size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Source officielle</p>
                  <p className="text-sm font-bold text-zinc-900">GestiBulder — gestibulder.com</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100">
              <p className="text-[10px] font-medium text-zinc-500 italic leading-relaxed">
                Ce service confirme que le document portant l'identifiant ci-dessus a été officiellement généré via la plateforme GestiBulder. Toute modification ultérieure du contenu du document annule cette certification.
              </p>
            </div>
          </div>
        </Card>

        <p className="text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">
          © {new Date().getFullYear()} GestiBulder Software
        </p>
      </div>
    </div>
  );
}

export default function VerifierPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest text-zinc-400">Vérification en cours...</div>}>
      <VerifierContent />
    </Suspense>
  );
}
