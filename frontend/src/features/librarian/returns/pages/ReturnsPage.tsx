import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/Button';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { Loader } from '../../../../shared/components/ui/loader/Loader';
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

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar as devoluções.';
}

export default function ReturnsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [returns, setReturns] = useState<ReturnRecordItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    const timeoutId = window.setTimeout(() => {
      async function loadReturnData() {
        setIsLoading(true);
        setLoadError(null);
        try {
          const result = await listReturnedLoans({
            page,
            size: PAGE_SIZE,
            search,
          });
          if (!active) return;
          setReturns(result.content.map(mapReturnedLoan));
          setTotalItems(result.totalElements);
          setTotalPages(Math.max(1, result.totalPages));
        } catch (error) {
          if (active) setLoadError(getErrorMessage(error));
        } finally {
          if (active) setIsLoading(false);
        }
      }

      void loadReturnData();
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [page, refresh, search]);

  useEffect(() => {
    if (!successMessage) return;
    const timeoutId = window.setTimeout(() => setSuccessMessage(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

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

        {successMessage && (
          <p className="type-small text-ok" role="status">
            {successMessage}
          </p>
        )}

        <SearchFilterBar
          placeholder="Pesquise por leitor, livro ou tombo..."
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />

        {isLoading ? (
          <div
            className="flex min-h-48 items-center justify-center"
            role="status"
            aria-label="Carregando devoluções"
          >
            <Loader />
          </div>
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
