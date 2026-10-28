import type { AffiliationType } from '../../../../shared/schemas/enums.schema';
import type { Course } from '../../../../shared/types/library';
import type { ReaderStatus } from '../types/readerStatus';
import {
  Badge,
  type BadgeVariant,
} from '../../../../shared/components/ui/Badge';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { Pagination } from '../../../../shared/components/ui/Pagination';
import {
  Table,
  type TableColumn,
} from '../../../../shared/components/ui/Table';

export interface ReadersItem {
  id: number;
  name: string;
  email: string;
  affiliationType: AffiliationType;
  course: Course | null;
  activeLoans: number;
  status: ReaderStatus;
}

export interface ReaderTableProps {
  readers: ReadersItem[];
  page: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const affiliationLabels: Record<AffiliationType, string> = {
  STUDENT: 'Estudante',
  EMPLOYEE: 'Funcionário',
  PROFESSOR: 'Professor',
};

const statusLabels: Record<ReaderStatus, string> = {
  OK: 'Em dia',
  PENDING: 'Com pendência',
};

const statusVariants: Record<ReaderStatus, BadgeVariant> = {
  OK: 'success',
  PENDING: 'danger',
};

export function ReadersTable({
  readers,
  page,
  totalItems,
  totalPages,
  onPageChange,
}: ReaderTableProps) {
  const summary = `Mostrando ${readers.length} de ${totalItems} ${
    totalItems === 1 ? 'leitor' : 'leitores'
  }`;
  const columns: TableColumn<ReadersItem>[] = [
    {
      key: 'name',
      header: 'Leitor',
      align: 'left',
      render: (reader) => reader.name,
    },
    {
      key: 'affiliationType',
      header: 'Vínculo',
      align: 'left',
      render: (reader) => affiliationLabels[reader.affiliationType],
    },
    {
      key: 'course',
      header: 'Curso',
      align: 'left',
      render: (reader) => reader.course?.name ?? '—',
    },
    {
      key: 'activeLoans',
      header: 'Empréstimos ativos',
      render: (reader) => reader.activeLoans,
    },
    {
      key: 'status',
      header: 'Situação',
      render: (reader) => (
        <Badge variant={statusVariants[reader.status]}>
          {statusLabels[reader.status]}
        </Badge>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      rows={readers}
      getRowKey={(reader) => reader.id}
      caption="Leitores cadastrados"
      emptyState={
        <EmptyState
          title="Nenhum leitor encontrado."
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
