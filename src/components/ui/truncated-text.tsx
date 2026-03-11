'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TruncatedTextProps extends React.ComponentProps<'div'> {
  text: string;
  lines?: number;
  className?: string;
}

export function TruncatedText({ text, lines = 1, className, ...props }: TruncatedTextProps) {
  const isMultiLine = lines > 1;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'max-w-full cursor-help',
            isMultiLine ? 'line-clamp-(--lines)' : 'truncate',
            className
          )}
          style={{ '--lines': lines } as React.CSSProperties}
          {...props}
        >
          {text}
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs break-words">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
