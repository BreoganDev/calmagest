import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl border px-4 py-2.5 text-sm',
          'bg-white/90 backdrop-blur-sm',
          'transition-all duration-200',
          'placeholder:text-rd-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          // Default state
          'border-rd-gray-200 focus:border-rd-calm-green focus:ring-rd-calm-green/20',
          // Error state
          error && 'border-rd-danger focus:border-rd-danger focus:ring-rd-danger/20 text-rd-danger',
          // Hover state
          'hover:border-rd-gray-300',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };