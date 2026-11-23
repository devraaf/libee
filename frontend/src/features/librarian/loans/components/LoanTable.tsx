import { Button } from '../../../../shared/components/ui/Button';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import {
  Table,
  type TableColumn,
} from '../../../../shared/components/ui/Table';
import { Pagination } from '../../../../shared/components/ui/Pagination';
import { Badge } from '../../../../shared/components/ui/Badge';
import type { LoanRecordItem } from '../utils/loan.mapper';
import { loanStatusPresentation } from '../utils/loan-status';

export interface LoanTableProps {
  loans: LoanRecordItem[];
  page: number;
  totalItems: number;
  totalPages: number;
  returningLoanId: number | null;
  onPageChange: (page: number) => void;
  onReturn: (loanId: number) => void;
}

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
  const columns: TableColumn<LoanRecordItem>[] = [
    {
      key: 'title',
      header: 'Título',
      align: 'left',
      render: (loan) => loan.title,
    },
    {
      key: 'accessionNumber',
      header: 'Tombo',
      render: (loan) => (
        <span className="font-mono">{loan.accessionNumber}</span>
      ),
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
        <Badge variant={loanStatusPresentation[loan.status].variant}>
          {loanStatusPresentation[loan.status].label}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (loan) =>
        loan.status === 'RETURNED' ? null : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={returningLoanId === loan.id}
            onClick={() => onReturn(loan.id)}
          >
            {returningLoanId === loan.id ? 'Devolvendo...' : 'Devolver'}
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
          title="Nenhum resultado encontrado"
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
