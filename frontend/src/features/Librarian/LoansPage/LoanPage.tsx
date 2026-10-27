import { useState, useEffect } from "react";
import { Plus, BookMarked, CircleCheck, AlarmClock } from "lucide-react";
import Navbar from "../../../shared/components/navigation/LibrarianNavbar";
import { Footer } from "../../../app/layout/Footer";
import { StatCard } from "../../../shared/components/ui/StatCard";
import SearchFilterBar from "../../../shared/components/ui/SearchFilterBar";
import TableFooter from "../../../shared/components/ui/TableFooter";
import { Modal } from "../../../shared/components/ui/Modal";
import RegisterReturnForm from "../Returns/components/RegisterReturnForm";

type Situacao = "Em dia" | "Atrasado";

interface LoanItem {
  id: number;
  titulo: string;
  tombo: string;
  leitor: string;
  dataloan: string;
  devolucaoPrevista: string;
  situacao: Situacao;
}

const badgeStyles: Record<Situacao, string> = {
  "Em dia": "bg-green-100 text-green-800",
  Atrasado: "bg-red-100 text-red-800",
};

export default function Loans() {
  const [busca, setBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [loansList, setLoansList] = useState<LoanItem[]>([]);
  const [selectedLoanForModal, setSelectedLoanForModal] = useState<LoanItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Carrega os empréstimos do localStorage
  useEffect(() => {
    const savedLoans = localStorage.getItem("loansList");
    if (savedLoans) {
      setLoansList(JSON.parse(savedLoans));
    } else {
      const initialLoans: LoanItem[] = [
        {
          id: 1,
          titulo: "Estrutura de dados",
          tombo: "09123458",
          leitor: "Maria Cunha",
          dataloan: "16/09/26",
          devolucaoPrevista: "23/09/26",
          situacao: "Em dia",
        },
      ];
      setLoansList(initialLoans);
      localStorage.setItem("loansList", JSON.stringify(initialLoans));
    }
  }, []);

  const handleOpenReturnModal = (loan: LoanItem) => {
    setSelectedLoanForModal(loan);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLoanForModal(null);
  };

  const handleConfirmReturn = (loan: LoanItem) => {
    const todayFormatted = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // 1. Remove da lista de empréstimos ativos e atualiza o localStorage
    const updatedLoans = loansList.filter((item) => item.id !== loan.id);
    setLoansList(updatedLoans);
    localStorage.setItem("loansList", JSON.stringify(updatedLoans));

    const savedReturns = localStorage.getItem("returnsList");
    const returnsList = savedReturns ? JSON.parse(savedReturns) : [];
    
    const newReturnRecord = {
      id: Date.now(),
      title: loan.titulo,
      copyCode: loan.tombo,
      reader: loan.leitor,
      returnDate: todayFormatted,
    };
    
    localStorage.setItem("returnsList", JSON.stringify([newReturnRecord, ...returnsList]));


    const savedActive = localStorage.getItem("activeLoans");
    if (savedActive) {
      const parsedActive = JSON.parse(savedActive);
      delete parsedActive[loan.tombo];
      localStorage.setItem("activeLoans", JSON.stringify(parsedActive));
    }

    setIsModalOpen(false);
    setSelectedLoanForModal(null);

    setSuccessToast(`Devolução do tombo ${loan.tombo} registrada com sucesso!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const filteredLoans = loansList.filter(
    (item) =>
      item.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      item.leitor.toLowerCase().includes(busca.toLowerCase()) ||
      item.tombo.includes(busca)
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFDF5] text-[#3B2A1A]">
      <Navbar />

      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all">
          {successToast}
        </div>
      )}

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Empréstimos</h1>
            <p className="text-sm text-[#6B5A45]">
              Consulte os empréstimos em andamento
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 self-start rounded-lg bg-[#9A5B00] px-4 py-2 text-sm font-medium text-[#FFFDF5] hover:bg-[#7F4A00]"
          >
            <Plus size={16} />
            Registrar empréstimo
          </button>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={<BookMarked size={18} />} label="Ativos" value={loansList.length} />
          <StatCard icon={<CircleCheck size={18} />} label="Em dia" value={loansList.filter(l => l.situacao === "Em dia").length} />
          <StatCard icon={<AlarmClock size={18} />} label="Atrasados" value={loansList.filter(l => l.situacao === "Atrasado").length} />
        </section>

        <div className="mb-4">
          <SearchFilterBar
            placeholder="Pesquise por leitor, livro ou tombo..."
            value={busca}
            onChange={setBusca}
          />
        </div>

        <section className="overflow-hidden rounded-lg border border-[#E7DCC4] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#F9F0DC] text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Tombo</th>
                  <th className="px-4 py-3">Leitor</th>
                  <th className="px-4 py-3">Data empréstimo</th>
                  <th className="px-4 py-3">Devolução prevista</th>
                  <th className="px-4 py-3">Situação</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-[#6B5A45]">
                      Nenhum empréstimo ativo encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => (
                    <tr key={loan.id} className="border-t border-[#E7DCC4]">
                      <td className="px-4 py-4">{loan.titulo}</td>
                      <td className="px-4 py-4 font-mono">{loan.tombo}</td>
                      <td className="px-4 py-4">{loan.leitor}</td>
                      <td className="px-4 py-4">{loan.dataloan}</td>
                      <td className="px-4 py-4">{loan.devolucaoPrevista}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${badgeStyles[loan.situacao]}`}
                        >
                          {loan.situacao}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenReturnModal(loan)}
                          className="rounded-lg border border-[#6B5A45] bg-white px-4 py-1.5 text-sm font-medium hover:bg-[#F9F0DC]"
                        >
                          Devolver
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <TableFooter
            text={`Mostrando ${filteredLoans.length} de ${loansList.length} empréstimos`}
            pages={[1]}
            activePage={paginaAtual}
            onPageChange={(page) => setPaginaAtual(page)}
            onPrevious={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
            onNext={() => setPaginaAtual((prev) => Math.min(prev + 1, 1))}
          />
        </section>
      </main>

      <Footer />

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title="Registrar devolução"
      >
        {selectedLoanForModal && (
          <RegisterReturnForm
            loan={{
              copyCode: selectedLoanForModal.tombo,
              title: selectedLoanForModal.titulo,
              reader: selectedLoanForModal.leitor,
            }}
            onCancel={handleCloseModal}
            onConfirm={() => handleConfirmReturn(selectedLoanForModal)}
          />
        )}
      </Modal>
    </div>
  );
}