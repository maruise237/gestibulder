# Directives de Développement GestiBulder

Ce document sert de guide de référence pour le développement de l'interface utilisateur de GestiBulder. Toute IA travaillant sur ce projet doit suivre ces instructions.

## 1. Système de Design : shadcn/ui

- **Exclusivité** : Utilisez exclusivement les composants de la bibliothèque **shadcn/ui** pour tous les éléments d'interface (boutons, cartes, inputs, dialogues, etc.).
- **Installation Automatique** : Si un composant requis n'est pas encore présent dans le dossier `@/components/ui`, utilisez la commande suivante pour l'installer avant de l'utiliser :
  ```bash
  npx shadcn@latest add [composant]
  ```
- **Localisation** : Les composants shadcn doivent se trouver dans `src/components/ui`.

## 2. Styles et Mise en Page

- **Minimalisme** : Gardez un style épuré, moderne et minimaliste.
- **Tailwind CSS** : Utilisez Tailwind CSS pour les ajustements de mise en page, le spacing et les styles spécifiques.
- **Thème** : Respectez les variables de thème de shadcn (`primary`, `muted`, `accent`, `destructive`, etc.) pour assurer la cohérence.
- **Responsive** : Assurez-vous que toutes les interfaces sont parfaitement adaptatives (mobile-first).

## 3. Architecture des Composants

- **Directive "use client"** : Ajoutez la directive `"use client"` **uniquement** sur les composants qui nécessitent de l'interactivité (gestion d'état, événements, etc.).
- **Composants Serveur** : Privilégiez les Server Components pour la récupération de données et le rendu statique.
- **Accessibilité** : Conservez les propriétés d'accessibilité (Radix UI) intégrées par défaut dans les composants shadcn.

## 4. Structure du Projet

- `src/app` : Routes et pages (App Router).
- `src/components/ui` : Composants de base shadcn/ui.
- `src/components/dashboard` : Composants spécifiques au tableau de bord.
- `src/lib/server` : Actions serveur et logique métier.
- `src/lib/supabase` : Configuration Supabase.

## 5. État Actuel (Transition)

Le projet est en phase de transition des composants personnalisés vers shadcn/ui. Les composants suivants doivent être remplacés en priorité :
- `src/components/ui/button.tsx` (actuellement personnalisé)
- `src/components/ui/card.tsx` (actuellement personnalisé)
- Inputs, Modaux et autres éléments UI dans les formulaires de création.
