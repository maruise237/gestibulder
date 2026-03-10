'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthFormWrapper } from '@/components/auth/auth-form-wrapper';
import { login } from '@/lib/server/auth.actions';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await login(formData);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError('Erreur de connexion. Veuillez vérifier vos identifiants.');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la connexion.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFormWrapper title="Bon retour !" subtitle="Connectez-vous pour gérer vos chantiers.">
      <form onSubmit={handleSubmit} className="text-foreground space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="email">
            Email professionnel
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="bg-background border-border focus:ring-primary/20 focus:border-primary w-full rounded-lg border px-4 py-2.5 transition-all outline-none focus:ring-2"
            placeholder="jean.dupont@entreprise.com"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="password">
              Mot de passe
            </label>
            <Link href="#" className="text-primary text-xs font-medium hover:underline">
              Oublié ?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="bg-background border-border focus:ring-primary/20 focus:border-primary w-full rounded-lg border px-4 py-2.5 transition-all outline-none focus:ring-2"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border p-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="border-primary-foreground/30 border-t-primary-foreground h-4 w-4 animate-spin rounded-full border-2" />
              Connexion en cours...
            </>
          ) : (
            'Se connecter'
          )}
        </button>

        <div className="mt-4 text-center text-sm">
          Vous n'avez pas de compte ?{' '}
          <Link href="/auth/signup" className="text-primary font-bold hover:underline">
            S'inscrire gratuitement
          </Link>
        </div>
      </form>
    </AuthFormWrapper>
  );
}
