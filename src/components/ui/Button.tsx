import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
          // Size
          size === 'sm' && 'px-2.5 py-1.5 text-xs gap-1.5',
          size === 'md' && 'px-4 py-2 text-sm gap-2',
          size === 'lg' && 'px-6 py-2.5 text-sm gap-2',
          // Variant
          variant === 'primary' &&
            'gradient-bg text-white shadow-glow hover:shadow-glow-lg hover:opacity-90',
          variant === 'secondary' &&
            'bg-surface border border-surface-border text-gray-300 hover:bg-surface-hover hover:border-accent/30',
          variant === 'ghost' &&
            'text-gray-400 hover:text-gray-200 hover:bg-surface-hover',
          variant === 'danger' &&
            'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20',
          variant === 'success' &&
            'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20',
          // Disabled
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
