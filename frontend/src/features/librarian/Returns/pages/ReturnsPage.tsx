import { useId, useState, useEffect, type FormEvent } from "react";
import { Footer } from "../../../../app/layout/Footer";
import SearchFilterBar from "../../../../shared/components/ui/SearchFilterBar";
import TableFooter from "../../../../shared/components/ui/TableFooter";
import { Modal } from "../../../../shared/components/ui/Modal";
import RegisterReturnForm from "../components/RegisterReturnForm";

export interface ActiveLoan {
  copyCode: string;
  title: string;
  reader: string;
}

interface ReturnRecord {
  id: number;
  title: string;
  copyCode: string;
  reader: string;
  returnDate: string;
}

export default function Returns() {
  const inputId = useId();
  const [copyCodeInput, setCopyCodeInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const [activeLoans, setActiveLoans] = useState<Record<string, ActiveLoan>>({});
  const [returnsList, setReturnsList] = useState<ReturnRecord[]>([]);
  
  const [selectedLoanForModal, setSelectedLoanForModal] = useState<ActiveLoan | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    const savedLoans = localStorage.getItem("activeLoans");
    const savedReturns = localStorage.getItem("returnsList");

    if (savedLoans) {
      setActiveLoans(JSON.parse(savedLoans));
    } else {
      const initialActive = {
        "09123458": { copyCode: "09123458", title: "Estrutura de dados", reader: "Maria Cunha" },
        "00123": { copyCode: "00123", title: "Algoritmos Avançados", reader: "João da Silva" }
      };
      setActiveLoans(initialActive);
      localStorage.setItem("activeLoans", JSON.stringify(initialActive));
    }

    if (savedReturns) {
      setReturnsList(JSON.parse(savedReturns));
    }
  }, []);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInputError(null);

    const trimmedCode = copyCodeInput.trim();
    if (!trimmedCode) {
      setInputError("Informe o tombo do exemplar.");
      return;
    }

    const loan = activeLoans[trimmedCode];
    
    if (!loan) {
      setInputError("Este exemplar não está emprestado.");
      return;
    }

    setSelectedLoanForModal(loan);
    setIsFormOpen(true);
  };

  const handleConfirmReturn = (loan: ActiveLoan) => {
    const todayFormatted = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const newRecord: ReturnRecord = {
      id: Date.now(),
      title: loan.title,
      copyCode: loan.copyCode,
      reader: loan.reader,
      returnDate: todayFormatted,
    };


    const updatedActiveLoans = { ...activeLoans };
    delete updatedActiveLoans[loan.copyCode];
    setActiveLoans(updatedActiveLoans);
    localStorage.setItem("activeLoans", JSON.stringify(updatedActiveLoans));


    const updatedReturns = [newRecord, ...returnsList];
    setReturnsList(updatedReturns);
    localStorage.setItem("returnsList", JSON.stringify(updatedReturns));

  
    const storedLoansList = localStorage.getItem("loansList");
    if (storedLoansList) {
      const parsedLoans = JSON.parse(storedLoansList);
      const filteredLoans = parsedLoans.filter((l: any) => l.tombo !== loan.copyCode);
      localStorage.setItem("loansList", JSON.stringify(filteredLoans));
    }

    setIsFormOpen(false);
    setSelectedLoanForModal(null);
    setCopyCodeInput("");

    setSuccessToast(`Devolução do tombo ${loan.copyCode} registrada com sucesso!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedLoanForModal(null);
  };

  const filteredReturns = returnsList.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.reader.toLowerCase().includes(search.toLowerCase()) ||
      item.copyCode.includes(search)
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFDF5] text-[#3B2A1A]">
      

      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all">
          {successToast}
        </div>
      )}

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Devoluções</h1>
          <p className="text-sm text-[#6B5A45]">Registre e consulte devoluções</p>
        </header>

        <form onSubmit={handleSearchSubmit} className="mb-6">
          <label htmlFor={inputId} className="mb-2 block text-xs font-semibold">
            Tombo do exemplar devolvido
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:max-w-md">
              <input
                id={inputId}
                type="text"
                value={copyCodeInput}
                onChange={(e) => {
                  setCopyCodeInput(e.target.value);
                  if (inputError) setInputError(null);
                }}
                placeholder="ex: 09123458"
                aria-invalid={Boolean(inputError)}
                aria-describedby={inputError ? `${inputId}-error` : undefined}
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#3B2A1A] placeholder:text-[#9A8B76] focus:outline-none ${
                  inputError
                    ? "border-red-400 focus:border-red-500"
                    : "border-[#E7DCC4] focus:border-[#9A5B00]"
                }`}
              />
              {inputError && (
                <p id={`${inputId}-error`} className="mt-1 text-xs text-red-700">
                  {inputError}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[#9A5B00] px-4 py-2.5 text-sm font-medium text-[#FFFDF5] hover:bg-[#7F4A00]"
            >
              Registrar devolução
            </button>
          </div>
        </form>

        <div className="mb-4">
          <SearchFilterBar
            placeholder="Pesquise por leitor, livro ou tombo..."
            value={search}
            onChange={setSearch}
          />
        </div>

        <section className="overflow-hidden rounded-lg border border-[#E7DCC4] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[#F9F0DC] text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Tombo</th>
                  <th className="px-4 py-3">Leitor</th>
                  <th className="px-4 py-3 text-right">Data devolução</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-[#6B5A45]">
                      Nenhuma devolução registrada.
                    </td>
                  </tr>
                ) : (
                  filteredReturns.map((item) => (
                    <tr key={item.id} className="border-t border-[#E7DCC4]">
                      <td className="px-4 py-4">{item.title}</td>
                      <td className="px-4 py-4 font-mono">{item.copyCode}</td>
                      <td className="px-4 py-4">{item.reader}</td>
                      <td className="px-4 py-4 text-right">{item.returnDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <TableFooter
            text={`Mostrando ${filteredReturns.length} de ${returnsList.length} devoluções`}
            pages={[1]}
            activePage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
            onPrevious={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            onNext={() => setCurrentPage((prev) => Math.min(prev + 1, 1))}
          />
        </section>
      </main>

      <Footer />

      <Modal
        open={isFormOpen}
        onClose={handleCloseForm}
        title="Registrar devolução"
      >
        {selectedLoanForModal && (
          <RegisterReturnForm
            loan={selectedLoanForModal}
            onCancel={handleCloseForm}
            onConfirm={handleConfirmReturn}
          />
        )}
      </Modal>
    </div>
  );
}