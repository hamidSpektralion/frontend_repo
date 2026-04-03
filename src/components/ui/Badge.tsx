type BadgeVariant = 'default' | 'success' | 'warn' | 'error' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-sp-border text-sp-text-dim',
  success: 'bg-sp-success/10 text-sp-success border border-sp-success/20',
  warn: 'bg-sp-warn/10 text-sp-warn border border-sp-warn/20',
  error: 'bg-sp-error/10 text-sp-error border border-sp-error/20',
  info: 'bg-sp-accent/10 text-sp-accent border border-sp-accent/20',
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantStyles[variant]}`}>
      {children}
    </span>
  );
}
