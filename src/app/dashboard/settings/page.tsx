'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context/app-context';
import {
  Building2,
  Shield,
  Palette,
  ChevronRight,
  Loader2,
  HardHat,
} from 'lucide-react';
import { updateEnterprise, updateUserProfile } from '@/lib/server/enterprise.actions';
import { getProjects } from '@/lib/server/project.actions';
import { CURRENCIES } from '@/lib/currencies';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';

export default function SettingsPage() {
  const { enterprise, userProfile, selectedProjectId, setSelectedProjectId } = useApp();
  const [activeSection, setActiveSection] = useState<'index' | 'enterprise' | 'profile' | 'project'>('index');
  const [isSaving, setIsSaving] = useState(false);

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await getProjects();
      if (res.error) throw new Error(res.error);
      return res.projects || [];
    }
  });

  const handleUpdateEnterprise = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      nom: formData.get('nom') as string,
      pays: formData.get('pays') as string,
      devise: formData.get('devise') as string,
    };
    await updateEnterprise(data);
    window.location.reload();
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      nom_complet: formData.get('nom_complet') as string,
      telephone: formData.get('telephone') as string,
    };
    await updateUserProfile(data);
    window.location.reload();
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl">Paramètres</h1>
          <p className="hidden text-size-xs font-medium text-muted-foreground sm:block">
            {activeSection === 'index'
              ? "Gérez les préférences de votre compte."
              : activeSection === 'enterprise'
                ? "Configuration de l'entreprise"
                : activeSection === 'project'
                  ? "Sélection du chantier actif"
                  : "Mon profil utilisateur"}
          </p>
        </div>
        {activeSection !== 'index' && (
          <Button variant="ghost" size="sm" onClick={() => setActiveSection('index')}>
            Retour
          </Button>
        )}
      </div>

      {activeSection === 'index' ? (
        <div className="grid gap-4 sm:gap-6">
          <div className="space-y-3">
            <h2 className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Organisation</h2>
            <div className="grid gap-3">
              <Card
                className="hover:bg-muted/50 cursor-pointer transition-colors border-border"
                onClick={() => setActiveSection('enterprise')}
                padding="none"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <p className="text-size-sm font-semibold">{enterprise?.nom || 'Entreprise'}</p>
                      <p className="text-[10px] text-muted-foreground">Organisation et devise.</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
              </Card>

              <Card
                className="hover:bg-muted/50 cursor-pointer transition-colors border-border"
                onClick={() => setActiveSection('project')}
                padding="none"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600">
                      <HardHat size={18} />
                    </div>
                    <div>
                      <p className="text-size-sm font-semibold">Chantier Actif</p>
                      <p className="text-[10px] text-muted-foreground">
                        {selectedProject ? `Actuellement: ${selectedProject.nom}` : "Aucun chantier sélectionné"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
              </Card>

              <Card className="opacity-50 grayscale cursor-not-allowed border-border" padding="none">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Palette size={18} />
                    </div>
                    <div>
                      <p className="text-size-sm font-semibold">Apparence</p>
                      <p className="text-[10px] text-muted-foreground">Personnalisation (Bientôt).</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Sécurité</h2>
            <Card
              className="hover:bg-muted/50 cursor-pointer transition-colors border-border"
              onClick={() => setActiveSection('profile')}
              padding="none"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Shield size={18} />
                  </div>
                  <div>
                    <p className="text-size-sm font-semibold">{userProfile?.nom_complet || 'Mon Compte'}</p>
                    <p className="text-[10px] text-muted-foreground">Informations personnelles.</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            </Card>
          </div>
        </div>
      ) : activeSection === 'enterprise' ? (
        <Card className="max-w-2xl border-border">
          <CardHeader className="p-4 sm:p-6 border-b border-border bg-muted/30">
            <CardTitle className="text-size-lg">Informations Entreprise</CardTitle>
            <CardDescription className="text-[10px]">Détails légaux de votre organisation.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleUpdateEnterprise} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom de l'entreprise</Label>
                <Input id="nom" name="nom" defaultValue={enterprise?.nom} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pays">Pays</Label>
                  <Input id="pays" name="pays" defaultValue={enterprise?.pays} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="devise">Devise</Label>
                  <Select name="devise" defaultValue={enterprise?.devise}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.code} - {curr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="pt-2">
                <Button type="submit" size="sm" disabled={isSaving} className="w-full sm:w-auto">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : activeSection === 'project' ? (
        <Card className="max-w-2xl border-border">
          <CardHeader className="p-4 sm:p-6 border-b border-border bg-muted/30">
            <CardTitle className="text-size-lg">Chantier Actif</CardTitle>
            <CardDescription className="text-[10px]">Sélectionnez le chantier sur lequel vous travaillez.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Choisir un chantier</Label>
                <Select
                  value={selectedProjectId || ''}
                  onValueChange={(val) => setSelectedProjectId(val || null)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Sélectionner..." />
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
              <p className="text-[10px] text-muted-foreground italic">
                Ce réglage affecte l'affichage des données sur l'ensemble du tableau de bord.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl border-border">
          <CardHeader className="p-4 sm:p-6 border-b border-border bg-muted/30">
            <CardTitle className="text-size-lg">Mon Profil</CardTitle>
            <CardDescription className="text-[10px]">Informations de contact.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom_complet">Nom complet</Label>
                <Input id="nom_complet" name="nom_complet" defaultValue={userProfile?.nom_complet} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input id="telephone" name="telephone" defaultValue={userProfile?.telephone || ''} placeholder="+213..." />
              </div>
              <div className="pt-2">
                <Button type="submit" size="sm" disabled={isSaving} className="w-full sm:w-auto">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Mettre à jour
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
