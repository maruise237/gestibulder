'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthFormWrapper } from '@/components/auth/auth-form-wrapper';
import { login } from '@/lib/server/auth.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

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
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <Link href="#" className="text-xs text-primary hover:underline">
              Oublié ?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
          />
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
          Se connecter
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Vous n'avez pas de compte ? </span>
          <Link href="/auth/signup" className="text-primary font-medium hover:underline">
            S'inscrire
          </Link>
        </div>
      </form>
    </AuthFormWrapper>
  );
}
