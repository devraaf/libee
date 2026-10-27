import { useState } from "react";
import { Plus, Users, CircleCheck, AlarmClock } from "lucide-react";
import Navbar from "../../../../shared/components/navigation/LibrarianNavbar";
import { Footer } from "../../../../app/layout/Footer";
import { StatCard } from "../../../../shared/components/ui/StatCard";
import SearchFilterBar from "../../../../shared/components/ui/SearchFilterBar";
import TableFooter from "../../../../shared/components/ui/TableFooter";
import Modal from "../../../../shared/components/ui/Modal";
import CreateReaderForm from "../components/CreateReaderForm";
import {
  bondLabels,
  statusLabels,
  type Reader,
  type ReaderStatus,
} from "../reader.model";

const course = "Desenvolvimento de Software Multiplataforma";

const readers: Reader[] = [
  { id: 1, name: "Mario Cunha", bond: "student", course, activeLoans: 0, status: "ok" },
  { id: 2, name: "Mario Cunha", bond: "teacher", course: null, activeLoans: 1, status: "ok" },
  { id: 3, name: "Mario Cunha", bond: "student", course: "Ciência de Dados", activeLoans: 1, status: "pending" },
  { id: 4, name: "Mario Cunha", bond: "student", course, activeLoans: 2, status: "ok" },
  { id: 5, name: "Mario Cunha", bond: "staff", course: null, activeLoans: 0, status: "ok" },
];

const statusStyles: Record<ReaderStatus, string> = {
  ok: "bg-green-100 text-green-800",
  pending: "bg-red-100 text-red-800",
};

export default function Readers() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFDF5] text-[#3B2A1A]">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leitores</h1>
            <p className="text-sm text-[#6B5A45]">
              Consulte os leitores cadastrados e o histórico de empréstimos de cada um
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 self-start rounded-lg bg-[#9A5B00] px-4 py-2 text-sm font-medium text-[#FFFDF5] hover:bg-[#7F4A00]"
          >
            <Plus size={16} />
            Cadastrar leitor
          </button>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={<Users size={18} />} label="Leitores" value={20} />
          <StatCard icon={<CircleCheck size={18} />} label="Com empréstimo ativo" value={10} />
          <StatCard icon={<AlarmClock size={18} />} label="Com pendência" value={4} />
        </section>

        <div className="mb-4">
          <SearchFilterBar
            placeholder="Buscar leitor"
            value={search}
            onChange={setSearch}
          />
        </div>

        <section className="overflow-hidden rounded-lg border border-[#E7DCC4] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#F9F0DC] text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3">Leitor</th>
                  <th className="px-4 py-3">Vínculo</th>
                  <th className="px-4 py-3">Curso</th>
                  <th className="px-4 py-3 text-center">Empréstimos ativos</th>
                  <th className="px-4 py-3">Situação</th>
                </tr>
              </thead>
              <tbody>
                {readers.map((reader) => (
                  <tr key={reader.id} className="border-t border-[#E7DCC4]">
                    <td className="px-4 py-4">{reader.name}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-[#F6EBD2] px-3 py-1 text-xs text-[#6B4A1E]">
                        {bondLabels[reader.bond]}
                      </span>
                    </td>
                    <td className="px-4 py-4">{reader.course ?? "---"}</td>
                    <td className="px-4 py-4 text-center">{reader.activeLoans}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${statusStyles[reader.status]}`}
                      >
                        {statusLabels[reader.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TableFooter
            text="Mostrando 5 de 20 leitores"
            pages={[1, 2]}
            activePage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
            onPrevious={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            onNext={() => setCurrentPage((prev) => Math.min(prev + 1, 2))}
          />
        </section>
      </main>

      <Footer />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Cadastrar leitor"
      >
        <CreateReaderForm onCancel={() => setIsFormOpen(false)} />
      </Modal>
    </div>
  );
}