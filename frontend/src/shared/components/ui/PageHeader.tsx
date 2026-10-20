import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Ação principal da página (ex.: botão "Cadastrar livro"). */
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="type-h1 text-fg">{title}</h1>
        {subtitle && <p className="type-small text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
