import type { RegisteredReader } from '@/features/auth/services/auth.service';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../../../shared/components/ui/Button';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { PageHeader } from '../../../../shared/components/ui/PageHeader';
import SearchFilterBar from '../../../../shared/components/ui/SearchFilterBar';
import { Select } from '../../../../shared/components/ui/Select';
import type { AffiliationType } from '../../../../shared/schemas/enums.schema';
import { ReaderStats } from '../components/ReadersStats';
import { ReadersTable } from '../components/ReadersTable';
import RegisterReaderModal from '../components/RegisterReaderModal';
import { LoadingState } from '../../shared/components/LoadingState';
import {
  getReaderManagementSummary,
  listManagementReaders,
  type ManagementReaderStatus,
} from '../services/readers.service';
import {
  usePaginatedManagementList,
  type ManagementListParams,
} from '../../shared/hooks/usePaginatedManagementList';
import { useTransientMessage } from '../../shared/hooks/useTransientMessage';
import { getErrorMessage } from '../../shared/utils/error-message';
import { SuccessToast } from '../../shared/components/SuccessToast';

const PAGE_SIZE = 10;

export default function ReadersPage() {
  const [search, setSearch] = useState('');
  const [affiliationFilter, setAffiliationFilter] = useState<
    '' | AffiliationType
  >('');
  const [statusFilter, setStatusFilter] = useState<'' | ManagementReaderStatus>(
    '',
  );
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<{
    totalReaders: number;
    onLoan: number;
    pending: number;
  } | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const { message: successMessage, setMessage: setSuccessMessage } =
    useTransientMessage();

  const loadReaders = useCallback(
    ({ page, size, search }: ManagementListParams) =>
      listManagementReaders({
        page,
        size,
        search,
        affiliationType: affiliationFilter || undefined,
        status: statusFilter || undefined,
      }),
    [affiliationFilter, statusFilter],
  );
  const {
    items: readers,
    totalItems,
    totalPages,
    isLoading,
    error: loadError,
  } = usePaginatedManagementList({
    page,
    size: PAGE_SIZE,
    search,
    refreshKey: refresh,
    loadPage: loadReaders,
    errorFallback: 'Não foi possível carregar os leitores.',
  });

  useEffect(() => {
    let active = true;
    getReaderManagementSummary()
      .then((summary) => {
        if (active) {
          setStats({
            totalReaders: summary.totalReaders,
            onLoan: summary.readersWithActiveLoans,
            pending: summary.readersWithOverdueLoans,
          });
          setSummaryError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setSummaryError(
            getErrorMessage(error, 'Não foi possível carregar os leitores.'),
          );
        }
      });

    return () => {
      active = false;
    };
  }, [refresh]);

  function refreshData() {
    setStats(null);
    setSummaryError(null);
    setRefresh((current) => current + 1);
  }

  function handleReaderRegistered(reader: RegisteredReader) {
    setIsRegisterModalOpen(false);
    setSearch('');
    setAffiliationFilter('');
    setStatusFilter('');
    setPage(1);
    refreshData();
    setSuccessMessage(`Leitor "${reader.name}" cadastrado com sucesso.`);
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
      <SuccessToast message={successMessage} />

      <PageHeader
        title="Leitores"
        subtitle="Consulte os leitores cadastrados"
        action={
          <Button
            type="button"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsRegisterModalOpen(true)}
          >
            Cadastrar leitor
          </Button>
        }
      />
      <ReaderStats {...(stats ?? {})} />
      {summaryError && (
        <p className="type-small text-danger" role="alert">
          Não foi possível carregar os cards: {summaryError}
        </p>
      )}

      <SearchFilterBar
        placeholder="Buscar por nome ou e-mail..."
        value={search}
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        filterContent={
          <div className="flex flex-col gap-4">
            <Select
              density="compact"
              label="Vínculo"
              value={affiliationFilter}
              onChange={(event) => {
                setAffiliationFilter(
                  event.target.value as '' | AffiliationType,
                );
                setPage(1);
              }}
              placeholder="Todos os vínculos"
              placeholderDisabled={false}
              options={[
                { value: 'STUDENT', label: 'Estudante' },
                { value: 'EMPLOYEE', label: 'Funcionário' },
                { value: 'PROFESSOR', label: 'Professor' },
              ]}
            />
            <Select
              density="compact"
              label="Situação"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value as '' | ManagementReaderStatus,
                );
                setPage(1);
              }}
              placeholder="Todas as situações"
              placeholderDisabled={false}
              options={[
                { value: 'REGULAR', label: 'Em dia' },
                { value: 'PENDING', label: 'Com pendência' },
              ]}
            />
          </div>
        }
      />

      {isLoading ? (
        <LoadingState label="Carregando leitores" />
      ) : loadError ? (
        <EmptyState
          title="Não foi possível carregar os leitores."
          description={loadError}
          action={
            <Button type="button" variant="outline" onClick={refreshData}>
              Tentar novamente
            </Button>
          }
        />
      ) : (
        <ReadersTable
          readers={readers}
          page={page}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
      <RegisterReaderModal
        open={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleReaderRegistered}
      />
    </section>
  );
}
