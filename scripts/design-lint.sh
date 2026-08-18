#!/usr/bin/env bash
# Vérifie mécaniquement la réintroduction des régressions de design décrites
# dans CLAUDE.md. Ne remplace pas une relecture humaine (certains patterns
# comme les icônes décoratives ou les cartes à fond plein ne sont pas
# détectables par grep), mais attrape les oublis les plus fréquents.
#
# Usage: bash scripts/design-lint.sh
# Exit code 0 = rien trouvé, 1 = au moins une régression détectée.

set -uo pipefail
cd "$(dirname "$0")/.."

FOUND=0
SRC="src/app src/components"
# On exclut src/components/ui/: les primitives shadcn/Base UI sont la
# fondation, pas la couche de style applicative que ces règles ciblent.
EXCLUDE_UI='/ui/'

check() {
  local description="$1"
  local pattern="$2"
  local matches
  matches=$(grep -rnE "$pattern" $SRC --include="*.tsx" 2>/dev/null | grep -v "$EXCLUDE_UI")
  if [ -n "$matches" ]; then
    echo "❌ $description"
    echo "$matches" | sed 's/^/   /'
    echo
    FOUND=1
  fi
}

echo "=== Vérification du design system (voir CLAUDE.md) ==="
echo

check "Échelle de gris froide 'zinc-*' (utiliser 'stone-*')" \
  '\bzinc-[0-9]+\b'

check "Token 'danger' supprimé (utiliser 'destructive')" \
  '\b(bg|text|border)-danger\b'

check "Espacement de lettres criard (uppercase/tracking-widest/tracking-[...])" \
  '\btracking-widest\b|tracking-\[[^]]*\]'

check "Couleur brute 'bg-white' pleine opacité (casse le mode sombre — bg-white/NN translucide sur fond coloré est OK)" \
  '(^|[ "])bg-white($|[ "])|hover:bg-white($|[ "])'

check "Bordure colorée à gauche de carte (pattern 'AI slop' classique)" \
  'border-l-(4|8)\s+border-l-(primary|destructive|success|warning|secondary)'

check "<SelectValue /> auto-fermante (affiche la valeur brute sans libellé)" \
  '<SelectValue\s*/>'

check "Couleur hexadécimale codée en dur dans un className" \
  'className="[^"]*#[0-9a-fA-F]{3,6}[^"]*"'

echo "=== Rappel : ces patterns nécessitent une relecture humaine (non détectables par grep) ==="
echo "  - Icône décorative dans un carré coloré en en-tête de carte/modale"
echo "  - Icône géante en filigrane dans un coin de carte"
echo "  - Bloc plein d'une couleur sémantique avec texte dessus"
echo "  - Valeur de base de données affichée brute sans passer par src/lib/labels.ts"
echo "  - État vide réinventé au lieu du composant EmptyState partagé"
echo
echo "=== Faux positif connu (à ignorer si rencontré) ==="
echo "  - 'bg-white' plein sur un point de progression actif, superposé à un"
echo "    en-tête déjà coloré (ex: onboarding-wizard.tsx) : pattern légitime,"
echo "    pas un token de fond de page/carte."
echo

if [ "$FOUND" -eq 0 ]; then
  echo "✅ Aucune régression mécanique détectée."
  exit 0
else
  echo "⚠️  Régressions détectées ci-dessus — corriger avant de committer."
  exit 1
fi
