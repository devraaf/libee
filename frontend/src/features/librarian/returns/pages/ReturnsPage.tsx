import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/Button';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import Modal from '../../../../shared/components/ui/Modal';
import { PageHeader } from '../../../../shared/components/ui/PageHeader';
import SearchFilterBar from '../../../../shared/components/ui/SearchFilterBar';
import {
  Table,
  type TableColumn,
} from '../../../../shared/components/ui/Table';
import { Pagination } from '../../../../shared/components/ui/Pagination';
import {
  listReturnedLoans,
  returnLoan,
} from '../../loans/services/loans.service';
import {
  mapReturnedLoan,
  type ReturnRecordItem,
} from '../../loans/utils/loan.mapper';
import RegisterReturnForm from '../components/RegisterReturnForm';
import {
  usePaginatedManagementList,
  type ManagementListParams,
} from '../../shared/hooks/usePaginatedManagementList';
import { useTransientMessage } from '../../shared/hooks/useTransientMessage';
import { LoadingState } from '../../shared/components/LoadingState';
import { SuccessToast } from '../../shared/components/SuccessToast';

const PAGE_SIZE = 10;

export default function ReturnsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const { message: successMessage, setMessage: setSuccessMessage } =
    useTransientMessage();

  const loadReturns = useCallback(
    async ({ page, size, search }: ManagementListParams) => {
      const result = await listReturnedLoans({ page, size, search });
      return { ...result, content: result.content.map(mapReturnedLoan) };
    },
    [],
  );
  const {
    items: returns,
    totalItems,
    totalPages,
    isLoading,
    error: loadError,
  } = usePaginatedManagementList({
    page,
    size: PAGE_SIZE,
    search,
    refreshKey: refresh,
    loadPage: loadReturns,
    errorFallback: 'Não foi possível carregar as devoluções.',
  });

  function handleOpenForm() {
    setSuccessMessage(null);
    setIsFormOpen(true);
  }

  async function handleConfirmReturn(accessionNumber: string) {
    await returnLoan(accessionNumber);
    setIsFormOpen(false);
    setSuccessMessage(
      `Devolução do tombo ${accessionNumber} registrada com sucesso.`,
    );
    setRefresh((current) => current + 1);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
  }

  const columns: TableColumn<ReturnRecordItem>[] = [
    {
      key: 'title',
      header: 'Título',
      align: 'left',
      render: (item) => item.title,
    },
    {
      key: 'copyCode',
      header: 'Tombo',
      render: (item) => <span className="font-mono">{item.copyCode}</span>,
    },
    {
      key: 'reader',
      header: 'Leitor',
      align: 'left',
      render: (item) => item.reader,
    },
    {
      key: 'returnDate',
      header: 'Data devolução',
      align: 'right',
      render: (item) => item.returnDate,
    },
  ];

  return (
    <>
      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
        <SuccessToast message={successMessage} />

        <PageHeader
          title="Devoluções"
          subtitle="Registre e consulte as devoluções da biblioteca"
          action={
            <Button
              type="button"
              leftIcon={<Plus size={16} />}
              onClick={handleOpenForm}
            >
              Registrar devolução
            </Button>
          }
        />
        <SearchFilterBar
          placeholder="Pesquise por leitor, livro ou tombo..."
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />

        {isLoading ? (
          <LoadingState label="Carregando devoluções" />
        ) : loadError ? (
          <EmptyState
            title="Não foi possível carregar as devoluções."
            description={loadError}
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => setRefresh((current) => current + 1)}
              >
                Tentar novamente
              </Button>
            }
          />
        ) : (
          <Table
            columns={columns}
            rows={returns}
            getRowKey={(item) => item.id}
            caption="Devoluções registradas"
            emptyState={
              <EmptyState
                title="Nenhum resultado encontrado"
                description="Os registros de devolução aparecerão aqui."
              />
            }
            footer={
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                summary={`Mostrando ${returns.length} de ${totalItems} ${
                  totalItems === 1 ? 'devolução' : 'devoluções'
                }`}
              />
            }
            className="shadow-sm"
            tableClassName="min-w-[640px]"
          />
        )}
      </section>

      <Modal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        title="Registrar devolução"
      >
        <RegisterReturnForm
          onCancel={handleCloseForm}
          onConfirm={handleConfirmReturn}
        />
      </Modal>
    </>
  );
}
