'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthFormWrapper } from '@/components/auth/auth-form-wrapper';
import { signUp } from '@/lib/server/auth.actions';

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        <div className="space-y-6 text-center">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
            {successMessage}
          </div>
          <p className="text-muted-foreground text-sm">
            Une fois votre compte confirmé, vous pourrez vous connecter pour accéder à votre tableau
            de bord.
          </p>
          <Link
            href="/auth/login"
            className="bg-primary text-primary-foreground block w-full rounded-lg py-3 font-bold shadow-lg"
          >
            Aller à la page de connexion
          </Link>
        </div>
      </AuthFormWrapper>
    );
  }

  return (
    <AuthFormWrapper
      title="Créer votre compte"
      subtitle="Rejoignez gestibulder pour centraliser vos chantiers."
    >
      <form onSubmit={handleSubmit} className="text-foreground space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="enterpriseName">
            Nom de l'entreprise
          </label>
          <input
            id="enterpriseName"
            name="enterpriseName"
            type="text"
            required
            className="bg-background border-border focus:ring-primary/20 focus:border-primary text-foreground w-full rounded-lg border px-4 py-2 transition-all outline-none focus:ring-2"
            placeholder="BTP Construction S.A."
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="name">
            Nom complet (Administrateur)
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="bg-background border-border focus:ring-primary/20 focus:border-primary text-foreground w-full rounded-lg border px-4 py-2 transition-all outline-none focus:ring-2"
            placeholder="Jean Dupont"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="email">
            Email professionnel
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="bg-background border-border focus:ring-primary/20 focus:border-primary text-foreground w-full rounded-lg border px-4 py-2 transition-all outline-none focus:ring-2"
            placeholder="jean.dupont@entreprise.com"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="bg-background border-border focus:ring-primary/20 focus:border-primary text-foreground w-full rounded-lg border px-4 py-2 transition-all outline-none focus:ring-2"
            placeholder="••••••••"
          />
          <p className="text-muted-foreground mt-1 text-[10px]">
            Minimum 8 caractères, un mélange de lettres et chiffres conseillé.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border p-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="border-primary-foreground/30 border-t-primary-foreground h-4 w-4 animate-spin rounded-full border-2" />
              Création en cours...
            </>
          ) : (
            'Créer mon compte'
          )}
        </button>

        <p className="text-muted-foreground px-4 text-center text-[10px]">
          En vous inscrivant, vous acceptez nos{' '}
          <Link href="#" className="underline">
            Conditions d'Utilisation
          </Link>{' '}
          et notre{' '}
          <Link href="#" className="underline">
            Politique de Confidentialité
          </Link>
          .
        </p>

        <div className="mt-4 text-center text-sm">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-primary font-bold hover:underline">
            Se connecter
          </Link>
        </div>
      </form>
    </AuthFormWrapper>
  );
}
