import { useState } from "react";
import { Plus, BookOpen, Library, CircleCheck, Clock, Pencil, X } from "lucide-react";
import LibrarianNavbar from "../../../shared/components/navigation/LibrarianNavbar";
import { Footer } from "../../../app/layout/Footer";
import { StatCard } from "../../../shared/components/ui/StatCard";
import SearchFilterBar from "../../../shared/components/ui/SearchFilterBar";
import TableFooter from "../../../shared/components/ui/TableFooter";

/*    Dado Ficticio para verificação do layout da pagina    */
const livro = {
  titulo: "Estrutura de dados",
  autores: "Mario Cunha",
  isbn: "09123458",
  categoria: "Romance",
  exemplares: 20,
};

export default function BookCollection() {
  const [busca, setBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFDF5] text-[#3B2A1A]">
      <LibrarianNavbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Acervo</h1>
            <p className="text-sm text-[#6B5A45]">
              Gerencie livros e exemplares da biblioteca
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 self-start rounded-lg bg-[#9A5B00] px-4 py-2 text-sm font-medium text-[#FFFDF5] hover:bg-[#7F4A00]"
          >
            <Plus size={16} />
            Cadastrar Livro
          </button>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<BookOpen size={18} />} label="Total de livros" value={100} />
          <StatCard icon={<Library size={18} />} label="Exemplares no acervo" value={500} />
          <StatCard icon={<CircleCheck size={18} />} label="Disponíveis" value={250} />
          <StatCard icon={<Clock size={18} />} label="Emprestados" value={250} />
        </section>

        <div className="mb-4">
          <SearchFilterBar
            placeholder="Pesquise por título, autor, ISBN ou tombo..."
            value={busca}
            onChange={setBusca}
          />
        </div>

        <section className="overflow-hidden rounded-lg border border-[#E7DCC4] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#F9F0DC] text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3">Capa</th>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Autor(es)</th>
                  <th className="px-4 py-3">ISBN</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3 text-right">Exemplares</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[#E7DCC4]">
                  <td className="px-4 py-3">
                    <div aria-hidden="true" className="h-12 w-9 rounded bg-[#EFEAE0]" />
                  </td>
                  <td className="px-4 py-3">{livro.titulo}</td>
                  <td className="px-4 py-3">{livro.autores}</td>
                  <td className="px-4 py-3">{livro.isbn}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#F6EBD2] px-3 py-1 text-xs text-[#6B4A1E]">
                      {livro.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{livro.exemplares}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        aria-label="Editar livro"
                        className="flex h-7 w-7 items-center justify-center rounded border border-[#E7DCC4] bg-white hover:bg-[#F9F0DC]"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label="Excluir livro"
                        className="flex h-7 w-7 items-center justify-center rounded border border-[#E7DCC4] bg-white hover:bg-[#F9F0DC]"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <TableFooter
            text="Mostrando 1 de 100 livros"
            pages={[1, 2, 3, 4]}
            activePage={paginaAtual}
            onPageChange={(page) => setPaginaAtual(page)}
            onPrevious={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
            onNext={() => setPaginaAtual((prev) => prev + 1)}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}