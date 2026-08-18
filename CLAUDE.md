# GestiBulder — Instructions pour Claude

Ce fichier est chargé automatiquement par Claude Code à chaque session sur ce
dépôt, où qu'il soit importé. **Toute création ou modification de composant
UI doit respecter ces règles sans qu'on ait besoin de les rappeler.**

## Contexte du projet

SaaS de gestion de chantiers BTP (Next.js 16 / TypeScript / Tailwind v4 /
Supabase / Base UI). Utilisateurs : superviseurs et admins d'entreprises de
construction, souvent sur téléphone Android en extérieur / plein soleil.
Domaines fonctionnels : chantiers, ouvriers, pointage, stocks, équipements,
finances.

## Direction de design (ne pas dévier sans qu'on le demande explicitement)

Direction éditoriale/structurelle — "registre de chantier fiable", pas
"pitch deck SaaS". Choisie après recherche sur les tendances 2026 et pour
rompre explicitement avec le look générique produit par les outils IA
(bordures colorées, icônes dans des carrés, indigo par défaut).

- **Typographie** : `font-display` (Fraunces, serif) pour tous les titres
  (`h1`/`h2`/`h3` l'appliquent déjà automatiquement via `globals.css`) et les
  gros chiffres. `font-sans` (IBM Plex Sans) pour l'interface courante.
  `font-tabular` (IBM Plex Mono, chiffres tabulaires) pour **tout chiffre
  financier ou quantitatif** (montants, %, dates, IDs) — jamais `font-sans`
  pour un montant.
- **Couleur** : palette de marque imposée par l'utilisateur, à ne jamais
  modifier sans instruction explicite :
  - `primary` = **Orange #E9631A** — accent unique, action principale
    uniquement, jamais de fond de page.
  - `secondary` / `sidebar` = **Dark Slate #315762** — navigation, texte
    fort.
  - `background`/`muted`/`card` dérivés de **Flash White #EFEFEF**.
  Ne jamais réintroduire d'indigo/violet. Palette neutre : classe
  `stone-*` (grise neutre, dérivée de Flash White), **jamais `zinc-*`**
  (supprimée du thème).
- **Rayon des coins** : contrôlé par le token `--radius` (0.3rem) dans
  `globals.css`. Ne pas coder des rayons en dur (`rounded-2xl`,
  `rounded-3xl` sont déjà restreints par le token — les utiliser normalement
  via les classes Tailwind standard, ne pas les élargir).

## Interdit — patterns trouvés et supprimés pendant la refonte

Ces patterns sont explicitement bannis parce qu'ils sont revenus à plusieurs
reprises et qu'ils sont les marqueurs les plus caractéristiques du design
"généré par IA" :

1. **Icône dans un carré coloré comme en-tête de carte/modale**
   (`<div className="bg-primary rounded-md p-2"><Icon /></div>` suivi d'un
   titre). La typographie doit porter la hiérarchie, pas une pastille
   d'icône décorative. Exception : les icônes d'action dans les boutons.
2. **Bordure colorée à gauche des cartes** (`border-l-4 border-l-primary`
   ou similaire). Utiliser une carte plate (`border-border`) ; la couleur
   sémantique passe par le texte ou une pastille de statut discrète.
3. **Icône géante décorative en filigrane** dans un coin de carte
   (`absolute opacity-5` avec une icône énorme). Jamais.
4. **Texte tout en majuscules codé en dur** dans le JSX (`>ENREGISTRER<`)
   ou via `uppercase`/`tracking-widest`/`tracking-[...]`. Écrire le texte en
   casse normale ; si un label discret est nécessaire, `text-xs` suffit,
   pas de transformation forcée.
5. **Bloc plein d'une couleur sémantique avec grand texte blanc dessus**
   (ex. `bg-primary text-primary-foreground` en pleine carte). Préférer un
   fond translucide (`bg-primary/5`) avec bordure assortie
   (`border-primary/20`) et texte de la couleur sémantique.
6. **Valeur brute de base de données affichée à l'utilisateur** (ex.
   `worker.type_paiement` → `journalier` au lieu de "Journalier",
   `expense.categorie` → `main_d_oeuvre` au lieu de "Main d'œuvre"). Utiliser
   systématiquement les maps de `src/lib/labels.ts`
   (`label(PAYMENT_TYPE_LABELS, value)` etc.) — jamais afficher un champ
   snake_case ou une valeur de `Select`/`enum` sans passer par une fonction
   de rendu (`<SelectValue>{(value) => ...}</SelectValue>`, jamais
   `<SelectValue />` seule quand value ≠ label).
7. **Empty state réinventé à chaque page**. Toujours utiliser
   `<EmptyState icon={...} title="..." description="..." action={...} />`
   (`src/components/dashboard/empty-state.tsx`), jamais un bloc
   `border-dashed` fait main.
8. **Couleurs brutes hors thème** : jamais `bg-white`, `text-black`,
   `#hexcode` en dur dans un `className`. Toujours les tokens
   (`bg-card`, `text-foreground`, `bg-muted`, etc.) — un `bg-white` codé en
   dur casse silencieusement le mode sombre.
9. **`hover:bg-X` sans `hover:text-X-foreground` assorti**. Un bouton dont
   le fond devient plein au survol doit systématiquement changer la couleur
   du texte en même temps, sinon le texte devient illisible/invisible.
   Vérifier aussi les cas imbriqués (parent `bg-X`, enfant `text-X` sans
   `-foreground`).

## Obligatoire

- Tout nouveau composant de formulaire réutilise les primitives de
  `src/components/ui/` (Base UI/shadcn) — jamais de `<button>`, `<input>`,
  `<select>`, `<table>` HTML natifs quand l'équivalent existe déjà dans
  `ui/`.
- Toute nouvelle correspondance valeur→libellé va dans
  `src/lib/labels.ts`, pas un objet local dupliqué dans le composant.
- Après toute modification de plusieurs fichiers, valider avec
  `npx tsc --noEmit` avant de considérer la tâche terminée.
- Avant de committer une refonte visuelle, relire ce fichier et vérifier
  qu'aucun des 9 patterns interdits n'a été réintroduit — idéalement en
  lançant `bash scripts/design-lint.sh` (voir plus bas).

## Vérification automatique

`scripts/design-lint.sh` détecte par recherche de motif la réintroduction
des régressions les plus objectivement détectables (couleurs brutes,
`tracking-widest`, `zinc-*`, `bg-white`/`hover:bg-white`, `border-l-4/8`
coloré, `<SelectValue />` seule). Il ne remplace pas une relecture humaine
(les patterns 1, 3, 5, 6, 7 nécessitent un jugement visuel) mais attrape les
oublis mécaniques. À lancer avant tout commit touchant `src/app` ou
`src/components` :

```bash
bash scripts/design-lint.sh
```

## Historique

Refonte complète effectuée en une série de sessions (voir historique git,
commits contenant "refonte" / "design system" / "editorial"). Avant cette
refonte, le projet utilisait shadcn/ui avec les tokens par défaut
(indigo, Geist, zinc) — décision explicite de l'utilisateur de tout
reconstruire pour se différencier du style générique produit par les outils
IA. Ne pas revenir en arrière vers ces défauts sans instruction explicite.
