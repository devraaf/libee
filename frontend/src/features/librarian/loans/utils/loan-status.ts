import type { BadgeVariant } from '../../../../shared/components/ui/Badge';
import type { LoanStatus } from '../../../../shared/types/library';

export const loanStatusPresentation: Record<
  LoanStatus,
  { label: string; variant: BadgeVariant }
> = {
  ON_TIME: { label: 'Em dia', variant: 'success' },
  OVERDUE: { label: 'Atrasado', variant: 'danger' },
  RETURNED: { label: 'Devolvido', variant: 'neutral' },
};
