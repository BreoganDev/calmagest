import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'h-11 w-full rounded-xl border px-4 text-sm',
          'bg-white/90 backdrop-blur-sm',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'border-rd-gray-200 focus:border-rd-calm-green focus:ring-rd-calm-green/20',
          'hover:border-rd-gray-300',
          error && 'border-rd-danger focus:border-rd-danger focus:ring-rd-danger/20 text-rd-danger',
          className
        )}
        {...props}
      />
    );
  }
);

Select.displayName = 'Select';
