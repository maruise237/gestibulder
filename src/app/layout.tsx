import { SupabasePing } from '@/components/supabase-ping';
import type { Metadata, Viewport } from 'next';
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const fraunces = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
  axes: ['opsz', 'SOFT', 'WONK'],
  style: ['normal', 'italic'],
});

const plexSans = IBM_Plex_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const plexMono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const viewport: Viewport = {
  themeColor: '#E9631A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'GestiBulder — Built for Builders',
  description: 'Système de gestion intelligent pour chantiers et entreprises du BTP.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SupabasePing />
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
