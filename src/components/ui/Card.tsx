import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
  className?: string;
}

export function Card({ children, title, actions, className = '' }: CardProps) {
  return (
    <div className={`bg-sp-surface border border-sp-border rounded-lg ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-sp-border">
          {title && <h3 className="text-sm font-medium text-sp-text">{title}</h3>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
