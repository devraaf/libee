import { Button } from '../../../../shared/components/ui/Button';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import {
  Table,
  type TableColumn,
} from '../../../../shared/components/ui/Table';
import { Pagination } from '../../../../shared/components/ui/Pagination';
import {
  Badge,
  type BadgeVariant,
} from '../../../../shared/components/ui/Badge';
import type { LoanStatus } from '../../../../shared/types/library';

export interface LoanTableItem {
  id: number;
  title: string;
  accessionNumber: string;
  readerName: string;
  loanDate: string;
  dueDate: string;
  status: LoanStatus;
}

export interface LoanTableProps {
  loans: LoanTableItem[];
  page: number;
  totalItems: number;
  totalPages: number;
  returningLoanId: number | null;
  onPageChange: (page: number) => void;
  onReturn: (loanId: number) => void;
}

const statusLabels: Record<LoanStatus, string> = {
  ON_TIME: 'Em dia',
  OVERDUE: 'Atrasado',
  RETURNED: 'Devolvido',
};

const statusVariants: Record<LoanStatus, BadgeVariant> = {
  ON_TIME: 'success',
  OVERDUE: 'danger',
  RETURNED: 'neutral',
};

export function LoanTable({
  loans,
  page,
  totalItems,
  totalPages,
  returningLoanId,
  onPageChange,
  onReturn,
}: LoanTableProps) {
  const summary = `Mostrando ${loans.length} de ${totalItems} ${
    totalItems === 1 ? 'empréstimo' : 'empréstimos'
  }`;
  const columns: TableColumn<LoanTableItem>[] = [
    {
      key: 'title',
      header: 'Título',
      align: 'left',
      render: (loan) => loan.title,
    },
    {
      key: 'accessionNumber',
      header: 'Tombo',
      render: (loan) => loan.accessionNumber,
    },
    {
      key: 'reader',
      header: 'Leitor',
      align: 'left',
      render: (loan) => loan.readerName,
    },
    {
      key: 'loanDate',
      header: 'Data empréstimo',
      render: (loan) => loan.loanDate,
    },
    {
      key: 'dueDate',
      header: 'Devolução prevista',
      render: (loan) => loan.dueDate,
    },
    {
      key: 'status',
      header: 'Situação',
      render: (loan) => (
        <Badge variant={statusVariants[loan.status]}>
          {statusLabels[loan.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (loan) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loan.status === 'RETURNED' || returningLoanId === loan.id}
          onClick={() => onReturn(loan.id)}
        >
          {returningLoanId === loan.id
            ? 'Devolvendo...'
            : loan.status === 'RETURNED'
              ? 'Devolvido'
              : 'Devolver'}
        </Button>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      rows={loans}
      getRowKey={(loan) => loan.id}
      caption="Empréstimos da biblioteca"
      emptyState={
        <EmptyState
          title="Nenhum empréstimo encontrado."
          description="Tente alterar os termos da busca."
        />
      }
      footer={
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          summary={summary}
        />
      }
      className="shadow-sm"
      tableClassName="min-w-[760px]"
    />
  );
}
