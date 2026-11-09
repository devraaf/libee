import { CheckCircle2, ClockAlert, Users } from 'lucide-react';
import { StatCard } from '../../../../shared/components/ui/StatCard';

export interface ReaderStatsProps {
  totalReaders?: number;
  onLoan?: number;
  pending?: number;
}

export function ReaderStats({
  totalReaders,
  onLoan,
  pending,
}: ReaderStatsProps) {
  return (
    <section
      aria-label="Resumo dos leitores"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      <StatCard
        icon={<Users size={18} />}
        label="Leitores"
        value={totalReaders}
      />
      <StatCard
        icon={<CheckCircle2 size={18} />}
        label="Com empréstimo ativo"
        value={onLoan}
      />
      <StatCard
        icon={<ClockAlert size={18} />}
        label="Com pendência"
        value={pending}
      />
    </section>
  );
}
