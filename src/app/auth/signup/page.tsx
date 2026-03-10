'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthFormWrapper } from '@/components/auth/auth-form-wrapper';
import { signUp } from '@/lib/server/auth.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await signUp(formData);
      if (result.success) {
        setSuccessMessage(result.message || 'Inscription réussie ! Veuillez vérifier votre email.');
      } else {
        setError(result.error || "Une erreur est survenue lors de l'inscription.");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  }

  if (successMessage) {
    return (
      <AuthFormWrapper
        title="Vérifiez vos emails"
        subtitle="Un lien de confirmation vous a été envoyé."
      >
        <div className="space-y-4 text-center">
          <div className="rounded-md bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            {successMessage}
          </div>
          <p className="text-muted-foreground text-sm">
            Une fois votre compte confirmé, vous pourrez vous connecter.
          </p>
          <Button asChild className="w-full">
            <Link href="/auth/login">Aller à la page de connexion</Link>
          </Button>
        </div>
      </AuthFormWrapper>
    );
  }

  return (
    <AuthFormWrapper
      title="Créer un compte"
      subtitle="Rejoignez gestibulder pour vos chantiers."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="enterpriseName">Nom de l'entreprise</Label>
          <Input
            id="enterpriseName"
            name="enterpriseName"
            type="text"
            required
            placeholder="BTP Construction S.A."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nom complet</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Jean Dupont"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email professionnel</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="jean.dupont@entreprise.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
          />
          <p className="text-[10px] text-muted-foreground">
            Minimum 8 caractères conseillés.
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Créer mon compte
        </Button>

        <p className="px-4 text-center text-[10px] text-muted-foreground">
          En vous inscrivant, vous acceptez nos{' '}
          <Link href="#" className="underline">Conditions</Link> et notre{' '}
          <Link href="#" className="underline">Confidentialité</Link>.
        </p>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Déjà un compte ? </span>
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            Se connecter
          </Link>
        </div>
      </form>
    </AuthFormWrapper>
  );
}
