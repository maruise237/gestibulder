import * as React from 'react';

import { cn } from '@/lib/utils';

function Card({
  className,
  size = 'default',
  padding = 'default',
  hoverable = false,
  ...props
}: React.ComponentProps<'div'> & {
  size?: 'default' | 'sm';
  padding?: 'default' | 'none';
  hoverable?: boolean;
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        'group/card bg-card text-card-foreground border-border flex flex-col overflow-hidden rounded-xl text-sm border shadow-sm',
        padding === 'default' && 'p-fluid-md',
        padding === 'none' && 'p-0',
        hoverable && 'hover:border-primary/20 cursor-pointer transition-all hover:shadow-md',
        'has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:p-fluid-sm data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl',
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'group/card-header @container/card-header grid auto-rows-min items-start gap-1 px-fluid-md pt-fluid-md group-data-[size=sm]/card:px-fluid-sm group-data-[size=sm]/card:pt-fluid-sm has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3',
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        'text-size-lg leading-snug font-semibold group-data-[size=sm]/card:text-size-base',
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-size-sm font-medium', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-fluid-md py-fluid-md group-data-[size=sm]/card:px-fluid-sm group-data-[size=sm]/card:py-fluid-sm', className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'bg-muted/50 flex items-center rounded-b-xl border-t border-border p-fluid-md group-data-[size=sm]/card:p-fluid-sm',
        className
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
