import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { formatLibraryDate } from '@/shared/utils/format-date';
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
import { useTableData } from '../../../../shared/hooks/useTableData';
import { listLoans, returnLoan } from '../../../loans/services/loans.service';
import RegisterReturnForm, {
  type ReturnLoanDetails,
} from '../components/RegisterReturnForm';
import {
  mapLoanRecords,
  type LoanRecordItem,
} from '../../loans/utils/loan.mapper';

interface ReturnTableItem {
  id: number;
  title: string;
  copyCode: string;
  reader: string;
  returnDate: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar as devoluções.';
}

function toReturnDetails(loan: LoanRecordItem): ReturnLoanDetails {
  return {
    loanId: loan.id,
    copyCode: loan.accessionNumber,
    title: loan.title,
    reader: loan.readerName,
  };
}

export default function ReturnsPage() {
  const inputId = useId();
  const [copyCodeInput, setCopyCodeInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loans, setLoans] = useState<LoanRecordItem[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<ReturnLoanDetails | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadReturnData() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const loanRecords = await listLoans();
        const mappedLoans = await mapLoanRecords(loanRecords);
        if (active) setLoans(mappedLoans);
      } catch (error) {
        if (active) setLoadError(getErrorMessage(error));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadReturnData();
    return () => {
      active = false;
    };
  }, [retry]);

  const returnedLoans: ReturnTableItem[] = useMemo(
    () =>
      loans.flatMap((loan) =>
        loan.returnDate
          ? [
              {
                id: loan.id,
                title: loan.title,
                copyCode: loan.accessionNumber,
                reader: loan.readerName,
                returnDate: formatLibraryDate(loan.returnDate),
              },
            ]
          : [],
      ),
    [loans],
  );

  const tableData = useTableData({
    data: returnedLoans,
    search,
    getSearchText: (item) => [item.reader, item.title, item.copyCode],
  });

  function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInputError(null);
    setSuccessMessage(null);

    const copyCode = copyCodeInput.trim();
    if (!copyCode) {
      setInputError('Informe o tombo do exemplar.');
      return;
    }

    const activeLoan = loans.find(
      (loan) => loan.returnDate === null && loan.accessionNumber === copyCode,
    );
    if (!activeLoan) {
      setInputError('Não há empréstimo ativo para esse tombo.');
      return;
    }

    setSelectedLoan(toReturnDetails(activeLoan));
    setIsFormOpen(true);
  }

  async function handleConfirmReturn() {
    if (!selectedLoan) return;
    await returnLoan(selectedLoan.loanId);
    setCopyCodeInput('');
    setIsFormOpen(false);
    setSelectedLoan(null);
    setSuccessMessage(
      `Devolução do tombo ${selectedLoan.copyCode} registrada com sucesso.`,
    );
    setRetry((current) => current + 1);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setSelectedLoan(null);
  }

  const columns: TableColumn<ReturnTableItem>[] = [
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
        />

        {successMessage && (
          <p className="type-small text-ok" role="status">
            {successMessage}
          </p>
        )}

        <form onSubmit={handleLookup} className="flex flex-col gap-2">
          <label htmlFor={inputId} className="type-label text-fg">
            Tombo do exemplar devolvido
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="w-full sm:max-w-md">
              <input
                id={inputId}
                type="text"
                value={copyCodeInput}
                onChange={(event) => {
                  setCopyCodeInput(event.target.value);
                  if (inputError) setInputError(null);
                }}
                placeholder="Ex.: 09123458"
                aria-invalid={Boolean(inputError)}
                aria-describedby={inputError ? `${inputId}-error` : undefined}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-fg placeholder:text-subtle focus:border-primary focus:outline-none"
              />
              {inputError && (
                <p
                  id={`${inputId}-error`}
                  className="type-caption mt-1 text-danger"
                  role="alert"
                >
                  {inputError}
                </p>
              )}
            </div>
            <Button type="submit" disabled={isLoading || Boolean(loadError)}>
              Registrar devolução
            </Button>
          </div>
        </form>

        <SearchFilterBar
          placeholder="Pesquise por leitor, livro ou tombo..."
          value={search}
          onChange={setSearch}
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
                onClick={() => setRetry((current) => current + 1)}
              >
                Tentar novamente
              </Button>
            }
          />
        ) : (
          <Table
            columns={columns}
            rows={tableData.items}
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
                page={tableData.page}
                totalPages={tableData.totalPages}
                onPageChange={tableData.setPage}
                summary={`Mostrando ${tableData.items.length} de ${tableData.totalItems} ${
                  tableData.totalItems === 1 ? 'devolução' : 'devoluções'
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
        {selectedLoan && (
          <RegisterReturnForm
            loan={selectedLoan}
            onCancel={handleCloseForm}
            onConfirm={handleConfirmReturn}
          />
        )}
      </Modal>
    </>
  );
}
