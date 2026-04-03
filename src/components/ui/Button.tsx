import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-sp-accent text-sp-bg hover:bg-sp-accent-dim font-medium',
  secondary: 'bg-sp-surface-2 text-sp-text border border-sp-border hover:border-sp-border-2',
  ghost: 'bg-transparent text-sp-text-dim hover:text-sp-text hover:bg-sp-surface-2',
  danger: 'bg-sp-error/10 text-sp-error border border-sp-error/30 hover:bg-sp-error/20',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-lg',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  children,
  fullWidth,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-40 pointer-events-none' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
