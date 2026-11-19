import type { AffiliationType } from '../../../../shared/schemas/enums.schema';
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
import type { ManagementReaderDto, ManagementReaderStatus } from '../services/readers.service';
import { maskPhone } from '@/shared/utils/format-phone';

export interface ReaderTableProps {
  readers: ManagementReaderDto[];
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

const statusLabels: Record<ManagementReaderStatus, string> = {
  REGULAR: 'Em dia',
  PENDING: 'Com pendência',
};

const statusVariants: Record<ManagementReaderStatus, BadgeVariant> = {
  REGULAR: 'success',
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
  const columns: TableColumn<ManagementReaderDto>[] = [
    {
      key: 'name',
      header: 'Leitor',
      align: 'left',
      className: 'whitespace-nowrap',
      render: (reader) => (
        <span className="block max-w-55 truncate" title={reader.name}>
          {reader.name}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'E-mail',
      align: 'left',
      render: (reader) => reader.email,
    },
    {
      key: 'phone',
      header: 'Telefone',
      align: 'left',
      className: 'w-[145px] whitespace-nowrap',
      render: (reader) => (reader.phone ? maskPhone(reader.phone) : '—'),
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
      render: (reader) => reader.courseName ?? '—',
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
      tableClassName="min-w-[760px] [&_th]:whitespace-nowrap"
    />
  );
}
