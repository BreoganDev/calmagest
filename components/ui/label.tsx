import * as React from 'react';
import { cn } from '@/lib/utils';

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & { error?: boolean }
>(({ className, error, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none transition-colors duration-200',
      error ? 'text-rd-danger' : 'text-rd-gray-700',
      className
    )}
    {...props}
  />
));
Label.displayName = 'Label';