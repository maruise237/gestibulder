'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Bell,
  CreditCard,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Globe,
  Building2,
  Palette,
  Loader2,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  getEnterprise,
  updateEnterprise,
  getUserProfile,
  updateUserProfile,
} from '@/lib/server/enterprise.actions';
import { CURRENCIES } from '@/lib/currencies';

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [enterprise, setEnterprise] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [ent, prof] = await Promise.all([getEnterprise(), getUserProfile()]);
    if (ent.enterprise) setEnterprise(ent.enterprise);
    if (prof.profile) setProfile(prof.profile);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateEnterprise = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      nom: formData.get('nom') as string,
      pays: formData.get('pays') as string,
      devise: formData.get('devise') as string,
    };
    const res = await updateEnterprise(data);
    if (res.success) {
      await fetchData();
      setActiveSection(null);
    } else {
      alert(res.error || 'Erreur lors de la mise à jour');
    }
    setIsSaving(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      nom_complet: formData.get('nom_complet') as string,
      telephone: formData.get('telephone') as string,
    };
    const res = await updateUserProfile(data);
    if (res.success) {
      await fetchData();
      setActiveSection(null);
    } else {
      alert(res.error || 'Erreur lors de la mise à jour');
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-indigo-600" />
        <p className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">
          Chargement des configurations...
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in space-y-10 pb-20 duration-500">
      {/* Header */}
      <div className="flex flex-col space-y-6">
        <button
          onClick={() => (activeSection ? setActiveSection(null) : router.back())}
          className="flex w-fit items-center gap-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase transition-colors hover:text-indigo-600"
        >
          <ArrowLeft size={14} strokeWidth={3} />
          {activeSection ? 'Retour aux réglages' : 'Retour'}
        </button>

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="space-y-1.5">
            <h1 className="text-4xl font-black tracking-tight text-zinc-950">
              {activeSection === 'enterprise'
                ? 'Profil Entreprise'
                : activeSection === 'profile'
                  ? 'Mon Compte'
                  : 'Paramètres Système'}
            </h1>
            <p className="font-bold tracking-tight text-zinc-500 italic">
              {activeSection === 'enterprise'
                ? 'Identité et informations légales de votre structure.'
                : activeSection === 'profile'
                  ? 'Gérez vos informations personnelles et vos accès.'
                  : 'Configuration globale de votre écosystème GestiBulder.'}
            </p>
          </div>
        </div>
      </div>

      {!activeSection ? (
        <div className="grid gap-10">
          {/* Espace de travail */}
          <div className="space-y-6">
            <h2 className="ml-2 text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
              Espace de travail
            </h2>
            <div className="grid gap-4">
              <Card
                hoverable
                className="group shadow-premium overflow-hidden border-none p-0"
                padding="none"
              >
                <div className="flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-transparent bg-blue-50 text-blue-600 shadow-sm">
                      <Building2 size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-black tracking-tight text-zinc-950">
                        {enterprise?.nom || "Profil de l'entreprise"}
                      </span>
                      <span className="max-w-md text-sm font-bold text-zinc-400">
                        Gérez l'identité visuelle et les paramètres par défaut.
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setActiveSection('enterprise')}
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-[10px] font-black tracking-widest text-zinc-400 uppercase transition-all group-hover:bg-indigo-50 group-hover:text-indigo-600"
                  >
                    Configurer
                  </Button>
                </div>
              </Card>

              <Card
                className="group shadow-premium cursor-not-allowed overflow-hidden border-none p-0 opacity-50"
                padding="none"
              >
                <div className="flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-transparent bg-purple-50 text-purple-600 shadow-sm">
                      <Palette size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-black tracking-tight text-zinc-950">
                        Apparence
                      </span>
                      <span className="max-w-md text-sm font-bold text-zinc-400">
                        Personnalisez le thème du tableau de bord.
                      </span>
                    </div>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-[9px] font-black tracking-widest text-zinc-400 uppercase">
                    Bientôt
                  </span>
                </div>
              </Card>
            </div>
          </div>

          {/* Compte & Sécurité */}
          <div className="space-y-6">
            <h2 className="ml-2 text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
              Compte & Sécurité
            </h2>
            <div className="grid gap-4">
              <Card
                hoverable
                className="group shadow-premium overflow-hidden border-none p-0"
                padding="none"
              >
                <div className="flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-transparent bg-zinc-100 text-zinc-950 shadow-sm">
                      <Shield size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-black tracking-tight text-zinc-950">
                        {profile?.nom_complet || 'Mon Compte'}
                      </span>
                      <span className="max-w-md text-sm font-bold text-zinc-400">
                        Mise à jour du profil et informations personnelles.
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setActiveSection('profile')}
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-[10px] font-black tracking-widest text-zinc-400 uppercase transition-all group-hover:bg-indigo-50 group-hover:text-indigo-600"
                  >
                    Configurer
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : activeSection === 'enterprise' ? (
        <Card className="shadow-premium max-w-2xl overflow-hidden border-none" padding="none">
          <form onSubmit={handleUpdateEnterprise} className="space-y-8 p-10">
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                  <Building2 size={12} className="text-indigo-500" /> Nom de l'entreprise
                </label>
                <input
                  name="nom"
                  defaultValue={enterprise?.nom}
                  required
                  className="h-14 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 font-black text-zinc-950 transition-all outline-none focus:border-indigo-600 focus:ring-8 focus:ring-indigo-600/5"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                    <MapPin size={12} className="text-indigo-500" /> Pays
                  </label>
                  <input
                    name="pays"
                    defaultValue={enterprise?.pays}
                    required
                    className="h-14 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 font-black text-zinc-950 transition-all outline-none focus:border-indigo-600 focus:ring-8 focus:ring-indigo-600/5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                    <Coins size={12} className="text-indigo-500" /> Devise de l'entreprise
                  </label>
                  <select
                    name="devise"
                    defaultValue={enterprise?.devise}
                    required
                    className="h-14 w-full cursor-pointer appearance-none rounded-2xl border border-zinc-200 bg-zinc-50 px-5 font-black text-zinc-950 transition-all outline-none focus:border-indigo-600 focus:ring-8 focus:ring-indigo-600/5"
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.code} - {curr.label} ({curr.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                isLoading={isSaving}
                className="h-14 flex-1 font-black tracking-widest uppercase shadow-xl shadow-indigo-100"
              >
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="shadow-premium max-w-2xl overflow-hidden border-none" padding="none">
          <form onSubmit={handleUpdateProfile} className="space-y-8 p-10">
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                  <User size={12} className="text-indigo-500" /> Nom complet
                </label>
                <input
                  name="nom_complet"
                  defaultValue={profile?.nom_complet}
                  required
                  className="h-14 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 font-black text-zinc-950 transition-all outline-none focus:border-indigo-600 focus:ring-8 focus:ring-indigo-600/5"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                  <Phone size={12} className="text-indigo-500" /> Téléphone
                </label>
                <input
                  name="telephone"
                  defaultValue={profile?.telephone}
                  placeholder="+213..."
                  className="h-14 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 font-black text-zinc-950 transition-all outline-none focus:border-indigo-600 focus:ring-8 focus:ring-indigo-600/5"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                isLoading={isSaving}
                className="h-14 flex-1 font-black tracking-widest uppercase shadow-xl shadow-indigo-100"
              >
                Mettre à jour mon profil
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Footer Alert */}
      <Card
        className="group shadow-elevated relative overflow-hidden border-none bg-indigo-600 p-10 text-white shadow-indigo-100"
        padding="none"
      >
        <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div className="space-y-3">
            <h3 className="text-2xl leading-tight font-black tracking-tight">
              Besoin d'une intégration sur mesure ?
            </h3>
            <p className="max-w-xl text-sm font-bold text-indigo-100 opacity-80">
              Notre forfait Enterprise offre un accès API complet et un support dédié pour les
              grandes entreprises de construction.
            </p>
          </div>
          <Button className="h-14 border-none bg-white px-10 text-[11px] font-black tracking-widest text-indigo-600 uppercase shadow-xl hover:bg-indigo-50">
            Contacter le Support
          </Button>
        </div>
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-32 w-32 rounded-full bg-white/5" />
      </Card>
    </div>
  );
}
