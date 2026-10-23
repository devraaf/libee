import { useState } from "react";
import { Plus, BookMarked, CircleCheck, AlarmClock } from "lucide-react";
import Navbar from "../../../shared/components/navigation/LibrarianNavbar";
import { Footer } from "../../../app/layout/Footer";
import { StatCard } from "../../../shared/components/ui/StatCard";
import SearchFilterBar from "../../../shared/components/ui/SearchFilterBar";
import TableFooter from "../../../shared/components/ui/TableFooter";

type Situacao = "Em dia" | "Atrasado";

const loan: {
  titulo: string;
  tombo: string;
  leitor: string;
  dataloan: string;
  devolucaoPrevista: string;
  situacao: Situacao;
} = {
  titulo: "Estrutura de dados",
  tombo: "09123458",
  leitor: "Maria Cunha",
  dataloan: "16/09/26",
  devolucaoPrevista: "23/09/26",
  situacao: "Em dia",
};

const badgeStyles: Record<Situacao, string> = {
  "Em dia": "bg-green-100 text-green-800",
  Atrasado: "bg-red-100 text-red-800",
};

export default function Loans() {
  const [busca, setBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1); // Estado para controlar a página atual

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFDF5] text-[#3B2A1A]">
      <Navbar />

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
          <StatCard icon={<BookMarked size={18} />} label="Ativos" value={10} />
          <StatCard icon={<CircleCheck size={18} />} label="Em dia" value={6} />
          <StatCard icon={<AlarmClock size={18} />} label="Atrasados" value={4} />
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
                <tr className="border-t border-[#E7DCC4]">
                  <td className="px-4 py-4">{loan.titulo}</td>
                  <td className="px-4 py-4">{loan.tombo}</td>
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
                      className="rounded-lg border border-[#6B5A45] bg-white px-4 py-1.5 text-sm font-medium hover:bg-[#F9F0DC]"
                    >
                      Devolver
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

  
          <TableFooter
            text="Mostrando 1 de 10 empréstimos"
            pages={[1, 2]}
            activePage={paginaAtual}
            onPageChange={(page) => setPaginaAtual(page)}
            onPrevious={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
            onNext={() => setPaginaAtual((prev) => Math.min(prev + 1, 2))}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}