import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Bloc d'état vide unique, réutilisé partout dans l'app (chantiers, ouvriers,
 * stocks, équipements, pointage...) pour garder un seul langage visuel plutôt
 * qu'une variante différente sur chaque page.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-16 text-center', className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <h2 className="text-size-base font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="mt-1.5 max-w-sm text-size-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
