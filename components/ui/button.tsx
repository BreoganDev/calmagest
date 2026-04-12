import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'outline' | 'destructive' | 'success';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-lg';
  asChild?: boolean;
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none',
        'active:scale-[0.97]',
        // Variants
        variant === 'default' && 'bg-white text-rd-gray-700 border border-rd-gray-200 hover:bg-rd-gray-50 hover:border-rd-gray-300 shadow-sm',
        variant === 'primary' && 'bg-rd-rose text-white border border-transparent hover:bg-rd-rose-deep shadow-sm hover:shadow-md',
        variant === 'ghost' && 'bg-transparent text-rd-gray-600 hover:bg-rd-rose-soft/50 hover:text-rd-gray-700',
        variant === 'outline' && 'bg-white/80 text-rd-gray-700 border border-rd-gray-200 hover:bg-rd-rose-soft/60 hover:border-rd-rose-soft',
        variant === 'destructive' && 'bg-rd-danger text-white border border-transparent hover:bg-red-600 shadow-sm',
        variant === 'success' && 'bg-rd-calm-green text-white border border-transparent hover:bg-green-600 shadow-sm',
        // Sizes
        size === 'default' && 'h-11 min-h-11 px-4 py-2 text-sm rounded-xl',
        size === 'sm' && 'h-11 min-h-11 px-3 py-1.5 text-xs rounded-lg',
        size === 'lg' && 'h-12 min-h-12 px-6 py-3 text-base rounded-2xl',
        size === 'icon' && 'h-11 w-11 min-h-11 rounded-xl',
        size === 'icon-lg' && 'h-12 w-12 min-h-12 rounded-2xl',
        className
      )}
      {...props}
    />
  );
}
