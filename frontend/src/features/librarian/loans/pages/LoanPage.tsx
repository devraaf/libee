import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/Button';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { Loader } from '../../../../shared/components/ui/loader/Loader';
import { PageHeader } from '../../../../shared/components/ui/PageHeader';
import SearchFilterBar from '../../../../shared/components/ui/SearchFilterBar';
import Modal from '../../../../shared/components/ui/Modal';
import {
  createLoan,
  getLoanManagementSummary,
  listManagementLoans,
  returnLoan,
  type LoanSummaryDto,
  type ManagementLoanStatus,
} from '../services/loans.service';
import { mapActiveLoan, type LoanRecordItem } from '../utils/loan.mapper';
import RegisterReturnForm, {
  type ReturnLoanDetails,
} from '../../returns/components/RegisterReturnForm';
import RegisterLoanForm from '../components/RegisterLoanForm';
import { LoanStats } from '../components/LoanStats';
import { LoanTable } from '../components/LoanTable';
import type { RegisterLoanFormData } from '../schemas/loan.schema';

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar os empréstimos.';
}

export default function LoanPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | ManagementLoanStatus>(
    '',
  );
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loans, setLoans] = useState<LoanRecordItem[]>([]);
  const [stats, setStats] = useState<LoanSummaryDto | null>(null);
  const [selectedLoanForReturn, setSelectedLoanForReturn] =
    useState<ReturnLoanDetails | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const timeoutId = window.setTimeout(() => {
      async function loadLoans() {
        setIsLoading(true);
        setLoadError(null);
        try {
          const result = await listManagementLoans({
            page,
            size: PAGE_SIZE,
            search,
            status: statusFilter || undefined,
          });
          if (!active) return;
          setLoans(result.content.map(mapActiveLoan));
          setTotalItems(result.totalElements);
          setTotalPages(Math.max(1, result.totalPages));
        } catch (error) {
          if (active) setLoadError(getErrorMessage(error));
        } finally {
          if (active) setIsLoading(false);
        }
      }

      void loadLoans();
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [page, refresh, search, statusFilter]);

  useEffect(() => {
    let active = true;
    getLoanManagementSummary()
      .then((summary) => {
        if (active) {
          setStats(summary);
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

  useEffect(() => {
    if (!successToast) return;
    const timeoutId = window.setTimeout(() => setSuccessToast(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [successToast]);

  function handleOpenReturnModal(loanId: number) {
    const loan = loans.find((item) => item.id === loanId);
    if (!loan) return;
    setSelectedLoanForReturn({
      loanId: loan.id,
      copyCode: loan.accessionNumber,
      title: loan.title,
      reader: loan.readerName,
    });
    setIsReturnModalOpen(true);
  }

  async function handleConfirmReturn(accessionNumber: string) {
    await returnLoan(accessionNumber);
    setIsReturnModalOpen(false);
    setSelectedLoanForReturn(null);
    setSuccessToast(
      `Devolução do tombo ${accessionNumber} registrada com sucesso!`,
    );
    refreshData();
  }

  async function handleCreateLoanSubmit(data: RegisterLoanFormData) {
    await createLoan({
      readerId: data.readerId,
      accessionNumber: data.accessionNumber.trim(),
      dueDate: data.dueDate,
    });
    setIsCreateModalOpen(false);
    setSuccessToast(
      `Empréstimo do tombo ${data.accessionNumber.trim()} registrado com sucesso!`,
    );
    refreshData();
  }

  return (
    <section className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
      {successToast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all"
        >
          {successToast}
        </div>
      )}

      <PageHeader
        title="Empréstimos"
        subtitle="Consulte os empréstimos e prazos de devolução"
        action={
          <Button
            type="button"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Registrar empréstimo
          </Button>
        }
      />

      <LoanStats {...(stats ?? {})} />
      {summaryError && (
        <p className="type-small text-danger" role="alert">
          Não foi possível carregar os cards: {summaryError}
        </p>
      )}

      <SearchFilterBar
        placeholder="Pesquise por leitor, livro ou tombo..."
        value={search}
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        filterContent={
          <label className="flex flex-col gap-2 text-sm text-fg">
            Situação
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value as '' | ManagementLoanStatus,
                );
                setPage(1);
              }}
              className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
            >
              <option value="">Todas as situações</option>
              <option value="ON_TIME">Em dia</option>
              <option value="OVERDUE">Atrasado</option>
            </select>
          </label>
        }
      />

      {isLoading ? (
        <div
          className="flex min-h-48 items-center justify-center"
          role="status"
          aria-label="Carregando empréstimos"
        >
          <Loader />
        </div>
      ) : loadError ? (
        <EmptyState
          title="Não foi possível carregar os empréstimos."
          description={loadError}
          action={
            <Button type="button" variant="outline" onClick={refreshData}>
              Tentar novamente
            </Button>
          }
        />
      ) : (
        <LoanTable
          loans={loans}
          page={page}
          totalItems={totalItems}
          totalPages={totalPages}
          returningLoanId={null}
          onPageChange={setPage}
          onReturn={handleOpenReturnModal}
        />
      )}

      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => {
          setIsReturnModalOpen(false);
          setSelectedLoanForReturn(null);
        }}
        title="Registrar devolução"
      >
        {selectedLoanForReturn && (
          <RegisterReturnForm
            loan={selectedLoanForReturn}
            onCancel={() => {
              setIsReturnModalOpen(false);
              setSelectedLoanForReturn(null);
            }}
            onConfirm={handleConfirmReturn}
          />
        )}
      </Modal>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Registrar empréstimo"
      >
        <RegisterLoanForm
          onCancel={() => setIsCreateModalOpen(false)}
          onConfirm={handleCreateLoanSubmit}
        />
      </Modal>
    </section>
  );
}
