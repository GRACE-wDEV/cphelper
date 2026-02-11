import { cn } from '@/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
        variant === 'default' && 'bg-surface border-surface-border text-gray-400',
        variant === 'accent' && 'bg-accent-muted border-accent/30 text-accent-light',
        variant === 'success' && 'bg-green-500/10 border-green-500/30 text-green-400',
        variant === 'warning' && 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
        variant === 'danger' && 'bg-red-500/10 border-red-500/30 text-red-400',
        variant === 'info' && 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
        className
      )}
    >
      {children}
    </span>
  );
}
