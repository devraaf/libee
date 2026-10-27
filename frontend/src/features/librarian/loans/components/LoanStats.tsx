import { AlarmClock, BookMarked, CircleCheck } from 'lucide-react';
import { StatCard } from '../../../../shared/components/ui/StatCard';

export interface LoanStatsProps {
  activeLoans?: number;
  onTimeLoans?: number;
  overdueLoans?: number;
}

export function LoanStats({
  activeLoans,
  onTimeLoans,
  overdueLoans,
}: LoanStatsProps) {
  return (
    <section
      aria-label="Resumo dos empréstimos"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      <StatCard
        icon={<BookMarked size={18} />}
        label="Ativos"
        value={activeLoans}
      />
      <StatCard
        icon={<CircleCheck size={18} />}
        label="Em dia"
        value={onTimeLoans}
      />
      <StatCard
        icon={<AlarmClock size={18} />}
        label="Atrasados"
        value={overdueLoans}
      />
    </section>
  );
}
