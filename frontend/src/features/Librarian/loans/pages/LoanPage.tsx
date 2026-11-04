import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/Button';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { Loader } from '../../../../shared/components/ui/Loader/Loader';
import { PageHeader } from '../../../../shared/components/ui/PageHeader';
import SearchFilterBar from '../../../../shared/components/ui/SearchFilterBar';
import Modal from '../../../../shared/components/ui/Modal';
import { getCurrentSession } from '../../../auth/services/auth.service';
import { listActiveCopies } from '../../../catalog/services/books.service';
import {
  createLoan,
  listLoans,
  returnLoan,
} from '../../../loans/services/loans.service';
import { dateFromToday } from '../../../../shared/mocks/dates';
import { useTableData } from '../../../../shared/hooks/useTableData';
import RegisterReturnForm, {
  type ReturnLoanDetails,
} from '../../returns/components/RegisterReturnForm';
import RegisterLoanForm from '../components/RegisterLoanForm';
import { LoanStats } from '../components/LoanStats';
import { LoanTable } from '../components/LoanTable';
import { mapLoanRecords, type LoanRecordItem } from '../loan.mapper';
import type { RegisterLoanFormData } from '../schemas/loan.schema';

interface LoanStatsData {
  activeLoans: number;
  onTimeLoans: number;
  overdueLoans: number;
}

function getStats(loans: LoanRecordItem[]): LoanStatsData {
  const activeLoans = loans.filter((loan) => loan.status !== 'RETURNED');
  return {
    activeLoans: activeLoans.length,
    onTimeLoans: activeLoans.filter((loan) => loan.status === 'ON_TIME').length,
    overdueLoans: activeLoans.filter((loan) => loan.status === 'OVERDUE')
      .length,
  };
}

async function getActiveLoanItems(): Promise<LoanRecordItem[]> {
  const records = await listLoans();
  const mappedRecords = await mapLoanRecords(records);
  return mappedRecords.filter((loan) => !loan.returnDate);
}

export default function LoanPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loans, setLoans] = useState<LoanRecordItem[]>([]);
  const [stats, setStats] = useState<LoanStatsData>({
    activeLoans: 0,
    onTimeLoans: 0,
    overdueLoans: 0,
  });
  const [selectedLoanForReturn, setSelectedLoanForReturn] =
    useState<ReturnLoanDetails | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadLoans() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const activeLoans = await getActiveLoanItems();
        if (!active) return;
        setLoans(activeLoans);
        setStats(getStats(activeLoans));
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os empréstimos.',
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadLoans();
    return () => {
      active = false;
    };
  }, [retry]);

  const tableData = useTableData({
    data: loans,
    search,
    getSearchText: (loan) => [
      loan.readerName,
      loan.title,
      loan.accessionNumber,
    ],
    filters: { status: statusFilter },
    matchesFilters: (loan, filters) =>
      !filters.status || loan.status === filters.status,
  });

  function handleOpenReturnModal(loanId: number) {
    const loan = loans.find((item) => item.id === loanId);
    if (!loan || loan.returnDate !== null || loan.status === 'RETURNED') return;
    setSelectedLoanForReturn({
      loanId: loan.id,
      copyCode: loan.accessionNumber,
      title: loan.title,
      reader: loan.readerName,
    });
    setIsReturnModalOpen(true);
  }

  async function handleConfirmReturn() {
    if (!selectedLoanForReturn) return;
    await returnLoan(selectedLoanForReturn.loanId);
    const updatedLoans = loans.filter(
      (loan) => loan.id !== selectedLoanForReturn.loanId,
    );
    setLoans(updatedLoans);
    setStats(getStats(updatedLoans));
    setIsReturnModalOpen(false);
    setSelectedLoanForReturn(null);
    setSuccessToast(
      `Devolução do tombo ${selectedLoanForReturn.copyCode} registrada com sucesso!`,
    );
    setTimeout(() => setSuccessToast(null), 4000);
  }

  async function handleCreateLoanSubmit(data: RegisterLoanFormData) {
    const session = await getCurrentSession();
    if (session?.user.profile !== 'LIBRARIAN') {
      throw new Error(
        'É necessário estar autenticado como bibliotecário para registrar um empréstimo.',
      );
    }

    const copyCode = data.copyCode.trim();
    const copies = await listActiveCopies();
    const copy = copies.find(
      ({ id, accessionNumber }) =>
        accessionNumber === copyCode || String(id) === copyCode,
    );
    if (!copy) {
      throw new Error('O exemplar selecionado não foi encontrado.');
    }

    await createLoan({
      readerId: Number(data.readerId),
      copyId: copy.id,
      librarianId: session.user.id,
      loanDate: dateFromToday(0),
      dueDate: data.dueDate,
    });
    const updatedLoans = await getActiveLoanItems();
    setLoans(updatedLoans);
    setStats(getStats(updatedLoans));
    setIsCreateModalOpen(false);
    setSuccessToast(
      `Empréstimo do tombo ${copy.accessionNumber} registrado com sucesso!`,
    );
    setTimeout(() => setSuccessToast(null), 4000);
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8 relative">
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

      <LoanStats {...stats} />

      <SearchFilterBar
        placeholder="Pesquise por leitor, livro ou tombo..."
        value={search}
        onChange={setSearch}
        filterContent={
          <label className="flex flex-col gap-2 text-sm text-fg">
            Situação
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setRetry((current) => current + 1)}
            >
              Tentar novamente
            </Button>
          }
        />
      ) : (
        <LoanTable
          loans={tableData.items}
          page={tableData.page}
          totalItems={tableData.totalItems}
          totalPages={tableData.totalPages}
          returningLoanId={null}
          onPageChange={tableData.setPage}
          onReturn={(loanId) => handleOpenReturnModal(loanId)}
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
