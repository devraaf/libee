import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/Button';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { PageHeader } from '../../../../shared/components/ui/PageHeader';
import SearchFilterBar from '../../../../shared/components/ui/SearchFilterBar';
import { Select } from '../../../../shared/components/ui/Select';
import Modal from '../../../../shared/components/ui/Modal';
import {
  createLoan,
  getLoanManagementSummary,
  listManagementLoans,
  returnLoan,
  type LoanSummaryDto,
  type ManagementLoanStatus,
} from '../services/loans.service';
import { mapActiveLoan } from '../utils/loan.mapper';
import RegisterReturnForm, {
  type ReturnLoanDetails,
} from '../../returns/components/RegisterReturnForm';
import RegisterLoanForm from '../components/RegisterLoanForm';
import { LoanStats } from '../components/LoanStats';
import { LoanTable } from '../components/LoanTable';
import type { RegisterLoanFormData } from '../schemas/loan.schema';
import { loanStatusPresentation } from '../utils/loan-status';
import { LoadingState } from '../../shared/components/LoadingState';
import { SuccessToast } from '../../shared/components/SuccessToast';
import {
  usePaginatedManagementList,
  type ManagementListParams,
} from '../../shared/hooks/usePaginatedManagementList';
import { useTransientMessage } from '../../shared/hooks/useTransientMessage';
import { getErrorMessage } from '../../shared/utils/error-message';

const PAGE_SIZE = 10;

export default function LoanPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | ManagementLoanStatus>(
    '',
  );
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<LoanSummaryDto | null>(null);
  const [selectedLoanForReturn, setSelectedLoanForReturn] =
    useState<ReturnLoanDetails | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const { message: successToast, setMessage: setSuccessToast } =
    useTransientMessage();

  const loadLoans = useCallback(
    async ({ page, size, search }: ManagementListParams) => {
      const result = await listManagementLoans({
        page,
        size,
        search,
        status: statusFilter || undefined,
      });
      return { ...result, content: result.content.map(mapActiveLoan) };
    },
    [statusFilter],
  );
  const {
    items: loans,
    totalItems,
    totalPages,
    isLoading,
    error: loadError,
  } = usePaginatedManagementList({
    page,
    size: PAGE_SIZE,
    search,
    refreshKey: refresh,
    loadPage: loadLoans,
    errorFallback: 'Não foi possível carregar os empréstimos.',
  });

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
        if (active) {
          setSummaryError(
            getErrorMessage(error, 'Não foi possível carregar os empréstimos.'),
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
      `Devolução do tombo ${accessionNumber} registrada com sucesso.`,
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
      `Empréstimo do tombo ${data.accessionNumber.trim()} registrado com sucesso.`,
    );
    refreshData();
  }

  return (
    <section className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
      <SuccessToast message={successToast} />

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
          <Select
            density="compact"
            label="Situação"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as '' | ManagementLoanStatus);
              setPage(1);
            }}
            placeholder="Todas as situações"
            placeholderDisabled={false}
            options={[
              {
                value: 'ON_TIME',
                label: loanStatusPresentation.ON_TIME.label,
              },
              {
                value: 'OVERDUE',
                label: loanStatusPresentation.OVERDUE.label,
              },
            ]}
          />
        }
      />

      {isLoading ? (
        <LoadingState label="Carregando empréstimos" />
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
