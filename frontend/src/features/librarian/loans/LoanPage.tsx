import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import SearchFilterBar from '../../../shared/components/ui/SearchFilterBar';
import { Modal } from '../../../shared/components/ui/Modal';
import { mockBooks, mockCopies, mockLoans, mockReaders } from '../../../shared/mocks/data';
import RegisterReturnForm from '../Returns/components/RegisterReturnForm';
import RegisterLoanForm from './components/RegisterLoanForm';
import { LoanStats } from './components/LoanStats';
import { LoanTable, type LoanTableItem } from './components/LoanTable';
import { type RegisterLoanFormData } from './schemas/loan.schema';

const PAGE_SIZE = 10;

interface LoanStatsData {
  activeLoans: number;
  onTimeLoans: number;
  overdueLoans: number;
}

function getStats(loans: LoanTableItem[]): LoanStatsData {
  const activeLoans = loans.filter((loan) => loan.status !== 'RETURNED');
  return {
    activeLoans: activeLoans.length,
    onTimeLoans: activeLoans.filter((loan) => loan.status === 'ON_TIME').length,
    overdueLoans: activeLoans.filter((loan) => loan.status === 'OVERDUE').length,
  };
}

export default function LoanPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loans, setLoans] = useState<LoanTableItem[]>([]);
  const [stats, setStats] = useState<LoanStatsData>({
    activeLoans: 0,
    onTimeLoans: 0,
    overdueLoans: 0,
  });

  const [selectedLoanForReturn, setSelectedLoanForReturn] = useState<LoanTableItem | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);


  useEffect(() => {
    const savedLoans = localStorage.getItem('loansList');
    if (savedLoans) {
      const parsedLoans: LoanTableItem[] = JSON.parse(savedLoans);
      setLoans(parsedLoans);
      setStats(getStats(parsedLoans));
    } else {
      const activeMockLoans = mockLoans.filter((l) => l.returnDate === null);

      const initialLoans: LoanTableItem[] = activeMockLoans.map((loan) => {
        const copy = mockCopies.find((c) => c.id === loan.copyId);
        const book = copy ? mockBooks.find((b) => b.id === copy.bookId) : null;
        const reader = mockReaders.find((r) => r.id === loan.readerId);

        const dueDateObj = new Date(loan.dueDate);
        const todayObj = new Date();
        const isOverdue = dueDateObj < todayObj;

        return {
          id: loan.id,
          title: book ? book.title : 'Livro Não Encontrado',
          accessionNumber: copy ? copy.accessionNumber : String(loan.copyId).padStart(4, '0'),
          readerName: reader ? reader.name : 'Leitor Não Cadastrado',
          loanDate: new Date(loan.loanDate).toLocaleDateString('pt-BR'),
          dueDate: dueDateObj.toLocaleDateString('pt-BR'),
          status: isOverdue ? 'OVERDUE' : 'ON_TIME',
        };
      });

      setLoans(initialLoans);
      setStats(getStats(initialLoans));
      localStorage.setItem('loansList', JSON.stringify(initialLoans));
    }
  }, []);

  const filteredLoans = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return loans;
    return loans.filter(
      (loan) =>
        loan.title.toLocaleLowerCase().includes(query) ||
        loan.readerName.toLocaleLowerCase().includes(query) ||
        loan.accessionNumber.toLocaleLowerCase().includes(query),
    );
  }, [loans, search]);

  const totalPages = Math.max(1, Math.ceil(filteredLoans.length / PAGE_SIZE));
  const visibleLoans = filteredLoans.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  const handleOpenReturnModal = (loanId: number) => {
    const loanToReturn = loans.find((l) => l.id === loanId);
    if (loanToReturn) {
      setSelectedLoanForReturn(loanToReturn);
      setIsReturnModalOpen(true);
    }
  };

  const handleConfirmReturn = (loan: LoanTableItem) => {
    const todayFormatted = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const updatedLoans = loans.filter((item) => item.id !== loan.id);
    setLoans(updatedLoans);
    setStats(getStats(updatedLoans));
    localStorage.setItem('loansList', JSON.stringify(updatedLoans));

    // Atualiza status do exemplar para AVAILABLE
    const savedCopies = localStorage.getItem('copiesList');
    const copies = savedCopies ? JSON.parse(savedCopies) : mockCopies;
    const updatedCopies = copies.map((c: any) =>
      c.accessionNumber === loan.accessionNumber ? { ...c, status: 'AVAILABLE' } : c
    );
    localStorage.setItem('copiesList', JSON.stringify(updatedCopies));

    // Salva o registro em devoluções
    const savedReturns = localStorage.getItem('returnsList');
    const returnsList = savedReturns ? JSON.parse(savedReturns) : [];
    const newReturnRecord = {
      id: Date.now(),
      title: loan.title,
      copyCode: loan.accessionNumber,
      reader: loan.readerName,
      returnDate: todayFormatted,
    };
    localStorage.setItem('returnsList', JSON.stringify([newReturnRecord, ...returnsList]));

    setIsReturnModalOpen(false);
    setSelectedLoanForReturn(null);

    setSuccessToast(`Devolução do tombo ${loan.accessionNumber} registrada com sucesso!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleCreateLoanSubmit = async (data: RegisterLoanFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const todayFormatted = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const [year, month, day] = data.dueDate.split('-');
    const formattedDueDate = `${day}/${month}/${year}`;

    // Busca dados do exemplar nos mocks/localStorage
    const savedCopies = localStorage.getItem('copiesList');
    const copies = savedCopies ? JSON.parse(savedCopies) : mockCopies;
    const copy = copies.find((c: any) => c.accessionNumber === data.copyCode || String(c.id) === data.copyCode);

    const savedBooks = localStorage.getItem('booksList');
    const books = savedBooks ? JSON.parse(savedBooks) : mockBooks;
    const book = copy ? books.find((b: any) => b.id === copy.bookId) : null;
    const bookTitle = book ? book.title : `Exemplar (${data.copyCode})`;

    // Atualiza o exemplar para ON_LOAN (emprestado)
    const updatedCopies = copies.map((c: any) =>
      c.accessionNumber === data.copyCode || String(c.id) === data.copyCode
        ? { ...c, status: 'ON_LOAN' }
        : c
    );
    localStorage.setItem('copiesList', JSON.stringify(updatedCopies));

    const newLoanItem: LoanTableItem = {
      id: Date.now(),
      title: bookTitle,
      accessionNumber: data.copyCode,
      readerName: data.readerName,
      loanDate: todayFormatted,
      dueDate: formattedDueDate,
      status: 'ON_TIME',
    };

    // Adiciona o novo empréstimo no topo da lista
    const updatedLoans = [newLoanItem, ...loans];
    setLoans(updatedLoans);
    setStats(getStats(updatedLoans));
    localStorage.setItem('loansList', JSON.stringify(updatedLoans));

    setIsCreateModalOpen(false);
    setSuccessToast(`Empréstimo do tombo ${data.copyCode} registrado com sucesso!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8 relative">
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all">
          {successToast}
        </div>
      )}

      <PageHeader
        title="Empréstimos"
        subtitle="Consulte os empréstimos e prazos de devolução"
        action={
          <Button type="button" leftIcon={<Plus size={16} />} onClick={() => setIsCreateModalOpen(true)}>
            Registrar empréstimo
          </Button>
        }
      />

      <LoanStats {...stats} />

      <SearchFilterBar
        placeholder="Pesquise por leitor, livro ou tombo..."
        value={search}
        onChange={handleSearchChange}
      />

      <LoanTable
        loans={visibleLoans}
        page={page}
        totalItems={filteredLoans.length}
        totalPages={totalPages}
        returningLoanId={null}
        onPageChange={setPage}
        onReturn={(loanId) => handleOpenReturnModal(loanId)}
      />

      <Modal
        open={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Registrar devolução"
      >
        {selectedLoanForReturn && (
          <RegisterReturnForm
            loan={{
              copyCode: selectedLoanForReturn.accessionNumber,
              title: selectedLoanForReturn.title,
              reader: selectedLoanForReturn.readerName,
            }}
            onCancel={() => setIsReturnModalOpen(false)}
            onConfirm={() => handleConfirmReturn(selectedLoanForReturn)}
          />
        )}
      </Modal>

      <Modal
        open={isCreateModalOpen}
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