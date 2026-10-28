import { BookOpen, CircleCheck, Clock, Library } from 'lucide-react';
import { StatCard } from '../../../../shared/components/ui/StatCard';

export interface BookCollectionStatsProps {
  totalBooks?: number;
  totalCopies?: number;
  availableCopies?: number;
  borrowedCopies?: number;
}

export function BookCollectionStats({
  totalBooks,
  totalCopies,
  availableCopies,
  borrowedCopies,
}: BookCollectionStatsProps) {
  return (
    <section
      aria-label="Resumo do acervo"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <StatCard
        icon={<BookOpen size={18} />}
        label="Total de livros"
        value={totalBooks}
      />
      <StatCard
        icon={<Library size={18} />}
        label="Exemplares no acervo"
        value={totalCopies}
      />
      <StatCard
        icon={<CircleCheck size={18} />}
        label="Disponíveis"
        value={availableCopies}
      />
      <StatCard
        icon={<Clock size={18} />}
        label="Emprestados"
        value={borrowedCopies}
      />
    </section>
  );
}
