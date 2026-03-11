'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TruncatedTextProps extends React.HTMLAttributes<HTMLDivElement> {
  children: string;
  lines?: number;
  tooltipClassName?: string;
}

export function TruncatedText({
  children,
  lines = 1,
  className,
  tooltipClassName,
  ...props
}: TruncatedTextProps) {
  const isMultiLine = lines > 1;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            isMultiLine ? 'line-clamp' : 'truncate',
            className
          )}
          style={
            isMultiLine
              ? ({
                  '--line-clamp': lines,
                  display: '-webkit-box',
                  WebkitLineClamp: lines,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                } as React.CSSProperties)
              : undefined
          }
          {...props}
        >
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent className={cn('max-w-xs break-words', tooltipClassName)}>
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
