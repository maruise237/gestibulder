'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context/app-context';
import {
  Building2,
  User,
  Shield,
  Palette,
  MapPin,
  Coins,
  Phone,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { updateEnterprise, updateUserProfile } from '@/lib/server/enterprise.actions';
import { CURRENCIES } from '@/lib/currencies';
import { cn } from '@/lib/utils';
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

export default function SettingsPage() {
  const { enterprise, userProfile } = useApp();
  const [activeSection, setActiveSection] = useState<'index' | 'enterprise' | 'profile'>('index');
  const [isSaving, setIsSaving] = useState(false);

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
    // Note: In a real app we'd trigger a router refresh or use a mutation
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

  const handleChantierChange = (val: string | null) => {
    // This is just to satisfy types if needed elsewhere,
    // but settings use local forms.
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
          <p className="text-sm text-muted-foreground">
            {activeSection === 'index'
              ? "Gérez les préférences de votre compte et de votre entreprise."
              : activeSection === 'enterprise'
                ? "Configuration de l'entreprise"
                : "Mon profil utilisateur"}
          </p>
        </div>
        {activeSection !== 'index' && (
          <Button variant="ghost" onClick={() => setActiveSection('index')}>
            Retour
          </Button>
        )}
      </div>

      {activeSection === 'index' ? (
        <div className="grid gap-6">
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground">Organisation</h2>
            <div className="grid gap-4">
              <Card
                className="hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setActiveSection('enterprise')}
              >
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-primary">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{enterprise?.nom || 'Entreprise'}</p>
                      <p className="text-xs text-muted-foreground">Paramètres de l'organisation et devise.</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              </Card>

              <Card className="opacity-50 grayscale cursor-not-allowed">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-primary">
                      <Palette size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Apparence</p>
                      <p className="text-xs text-muted-foreground">Personnalisation du thème (Bientôt).</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground">Sécurité</h2>
            <Card
              className="hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => setActiveSection('profile')}
            >
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-primary">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{userProfile?.nom_complet || 'Mon Compte'}</p>
                    <p className="text-xs text-muted-foreground">Informations personnelles et sécurité.</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </Card>
          </div>
        </div>
      ) : activeSection === 'enterprise' ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Informations de l'entreprise</CardTitle>
            <CardDescription>Mettez à jour les détails légaux de votre organisation.</CardDescription>
          </CardHeader>
          <CardContent>
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
                  <Select name="devise" defaultValue={enterprise?.devise} onValueChange={(val) => {}}>
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
              <div className="pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Mon Profil</CardTitle>
            <CardDescription>Gérez vos informations personnelles.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom_complet">Nom complet</Label>
                <Input id="nom_complet" name="nom_complet" defaultValue={userProfile?.nom_complet} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input id="telephone" name="telephone" defaultValue={userProfile?.telephone || ''} placeholder="+213..." />
              </div>
              <div className="pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Mettre à jour mon profil
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
