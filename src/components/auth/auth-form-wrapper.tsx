'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { HardHat } from 'lucide-react';

interface AuthFormWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthFormWrapper = ({ children, title, subtitle }: AuthFormWrapperProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <HardHat size={24} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <Card className="border-none shadow-none bg-background p-6">
          {children}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} gestibulder — La gestion de chantier simplifiée.
        </p>
      </div>
    </div>
  );
};
