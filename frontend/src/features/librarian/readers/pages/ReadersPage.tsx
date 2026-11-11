import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/Button';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { Loader } from '../../../../shared/components/ui/loader/Loader';
import { PageHeader } from '../../../../shared/components/ui/PageHeader';
import SearchFilterBar from '../../../../shared/components/ui/SearchFilterBar';
import {
  listManagementReaders,
  getReaderManagementSummary,
  type ManagementReaderStatus,
} from '../services/readers.service';
import { ReaderStats } from '../components/ReadersStats';
import { ReadersTable, type ReadersItem } from '../components/ReadersTable';
import type { AffiliationType } from '../../../../shared/schemas/enums.schema';
import RegisterReaderModal from '../components/RegisterReaderModal';
import type { RegisteredReader } from '@/features/auth/services/auth.service';

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar os leitores.';
}

export default function ReadersPage() {
  const [search, setSearch] = useState('');
  const [affiliationFilter, setAffiliationFilter] = useState<
    '' | AffiliationType
  >('');
  const [statusFilter, setStatusFilter] = useState<'' | ManagementReaderStatus>(
    '',
  );
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [readers, setReaders] = useState<ReadersItem[]>([]);
  const [stats, setStats] = useState<{
    totalReaders: number;
    onLoan: number;
    pending: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timeoutId = window.setTimeout(() => {
      async function loadReaderData() {
        setIsLoading(true);
        setLoadError(null);
        try {
          const result = await listManagementReaders({
            page,
            size: PAGE_SIZE,
            search,
            affiliationType: affiliationFilter || undefined,
            status: statusFilter || undefined,
          });
          if (!active) return;
          setReaders(
            result.content.map((reader) => ({
              id: reader.id,
              name: reader.name,
              email: reader.email,
              affiliationType: reader.affiliationType,
              course: reader.courseName ? { name: reader.courseName } : null,
              activeLoans: reader.activeLoans,
              status: reader.status === 'PENDING' ? 'PENDING' : 'OK',
            })),
          );
          setTotalItems(result.totalElements);
          setTotalPages(Math.max(result.totalPages, 1));
        } catch (error) {
          if (active) setLoadError(getErrorMessage(error));
        } finally {
          if (active) setIsLoading(false);
        }
      }

      void loadReaderData();
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [affiliationFilter, page, refresh, search, statusFilter]);

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
        if (active) setSummaryError(getErrorMessage(error));
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

  useEffect(() => {
    if (!successMessage) return;
    const timeoutId = window.setTimeout(() => setSuccessMessage(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
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

      {successMessage && (
        <p className="type-small text-ok" role="status">
          {successMessage}
        </p>
      )}

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
            <label className="flex flex-col gap-2 text-sm text-fg">
              Vínculo
              <select
                value={affiliationFilter}
                onChange={(event) => {
                  setAffiliationFilter(
                    event.target.value as '' | AffiliationType,
                  );
                  setPage(1);
                }}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
              >
                <option value="">Todos os vínculos</option>
                <option value="STUDENT">Estudante</option>
                <option value="EMPLOYEE">Funcionário</option>
                <option value="PROFESSOR">Professor</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-fg">
              Situação
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value as '' | ManagementReaderStatus,
                  );
                  setPage(1);
                }}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
              >
                <option value="">Todas as situações</option>
                <option value="REGULAR">Em dia</option>
                <option value="PENDING">Com pendência</option>
              </select>
            </label>
          </div>
        }
      />

      {isLoading ? (
        <div
          className="flex min-h-48 items-center justify-center"
          role="status"
          aria-label="Carregando leitores"
        >
          <Loader />
        </div>
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
