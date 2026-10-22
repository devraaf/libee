import type { ReactNode } from 'react';
import { Card } from './Card';

export interface StatCardProps {
  label: string;
  icon: ReactNode;
  /** Quando não houver dado disponível, exibe um traço. */
  value?: string | number;
}

export function StatCard({ label, icon, value }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4 px-5 py-4">
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center bg-chip text-muted [clip-path:polygon(25%_5%,75%_5%,100%_50%,75%_95%,25%_95%,0_50%)]"
      >
        {icon}
      </span>
      <div className="flex flex-col">
        <span className="type-caption text-muted">{label}</span>
        <span className="type-h3 text-fg">{value ?? '—'}</span>
      </div>
    </Card>
  );
}
