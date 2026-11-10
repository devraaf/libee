import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/Button';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { Loader } from '../../../../shared/components/ui/loader/Loader';
import Modal from '../../../../shared/components/ui/Modal';
import { PageHeader } from '../../../../shared/components/ui/PageHeader';
import SearchFilterBar from '../../../../shared/components/ui/SearchFilterBar';
import { useTableData } from '../../../../shared/hooks/useTableData';
import { listCourses } from '../../../reader/catalog/mock-services/catalog.service';
import { listLoans } from '../../../loans/services/loans.service';
import { createReader, listReaders } from '../services/readers.service';
import type { AffiliationType } from '../../../../shared/schemas/enums.schema';
import type { Course, Loan, Reader } from '../../../../shared/types/library';
import { ReaderStats } from '../components/ReadersStats';
import CreateReaderForm from '../components/CreateReaderForm';
import { ReadersTable, type ReadersItem } from '../components/ReadersTable';
import type { ReaderFormValues } from '../types/reader.model';

interface ReaderStatsData {
  totalReaders: number;
  onLoan: number;
  pending: number;
}

interface ReaderData {
  readers: ReadersItem[];
  stats: ReaderStatsData;
  courses: Course[];
}

function mapReaderData(
  readers: Reader[],
  loans: Loan[],
  courses: Course[],
): ReaderData {
  const coursesById = new Map(courses.map((course) => [course.id, course]));
  const loansByReaderId = new Map<number, Loan[]>();
  loans.forEach((loan) => {
    const readerLoans = loansByReaderId.get(loan.readerId) ?? [];
    readerLoans.push(loan);
    loansByReaderId.set(loan.readerId, readerLoans);
  });

  const items = readers.map((reader): ReadersItem => {
    const readerLoans = loansByReaderId.get(reader.id) ?? [];
    const activeLoans = readerLoans.filter(
      (loan) => loan.status !== 'RETURNED',
    );
    return {
      id: reader.id,
      name: reader.name,
      email: reader.email,
      affiliationType: reader.affiliationType,
      course: reader.courseId
        ? (coursesById.get(reader.courseId) ?? null)
        : null,
      activeLoans: activeLoans.length,
      status: activeLoans.some((loan) => loan.status === 'OVERDUE')
        ? 'PENDING'
        : 'OK',
    };
  });

  return {
    readers: items,
    stats: {
      totalReaders: items.length,
      onLoan: items.filter((reader) => reader.activeLoans > 0).length,
      pending: items.filter((reader) => reader.status === 'PENDING').length,
    },
    courses,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar os leitores.';
}

export default function ReadersPage() {
  const [search, setSearch] = useState('');
  const [affiliationFilter, setAffiliationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [readers, setReaders] = useState<ReadersItem[]>([]);
  const [stats, setStats] = useState<ReaderStatsData>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadReaderData() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [readerRecords, loans, courseRecords] = await Promise.all([
          listReaders(),
          listLoans(),
          listCourses(),
        ]);
        if (!active) return;
        const data = mapReaderData(readerRecords, loans, courseRecords);
        setReaders(data.readers);
        setStats(data.stats);
        setCourses(data.courses);
      } catch (error) {
        if (active) setLoadError(getErrorMessage(error));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadReaderData();
    return () => {
      active = false;
    };
  }, [retry]);

  useEffect(() => {
    if (!successMessage) return;
    const timeoutId = window.setTimeout(() => setSuccessMessage(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  const tableData = useTableData({
    data: readers,
    search,
    getSearchText: (reader) => reader.name,
    filters: {
      affiliation: affiliationFilter,
      status: statusFilter,
    },
    matchesFilters: (reader, filters) =>
      (!filters.affiliation ||
        reader.affiliationType === filters.affiliation) &&
      (!filters.status || reader.status === filters.status),
  });

  async function handleCreateReader(values: ReaderFormValues) {
    const affiliationType: AffiliationType =
      values.bond === 'student'
        ? 'STUDENT'
        : values.bond === 'teacher'
          ? 'PROFESSOR'
          : 'EMPLOYEE';
    const course = courses.find(({ name }) => name === values.course);

    await createReader({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.replace(/\D/g, ''),
      affiliationType,
      ...(affiliationType === 'STUDENT' && course
        ? { courseId: course.id }
        : {}),
    });

    setSearch('');
    setAffiliationFilter('');
    setStatusFilter('');
    setSuccessMessage(`Leitor cadastrado com sucesso.`);
    setRetry((current) => current + 1);
  }

  return (
    <>
      {successMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          {successMessage}
        </div>
      )}
      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
        <PageHeader
          title="Leitores"
          subtitle="Consulte os leitores cadastrados"
          action={
            <Button
              type="button"
              leftIcon={<Plus size={16} />}
              onClick={() => setIsFormOpen(true)}
            >
              Cadastrar leitor
            </Button>
          }
        />

        <ReaderStats {...stats} />

        <SearchFilterBar
          placeholder="Buscar por nome..."
          value={search}
          onChange={setSearch}
          filterContent={
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm text-fg">
                Vínculo
                <select
                  value={affiliationFilter}
                  onChange={(event) => setAffiliationFilter(event.target.value)}
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                >
                  <option value="">Todos os vínculos</option>
                  <option value="STUDENT">Estudante</option>
                  <option value="EMPLOYEE">Funcionário</option>
                  <option value="PROFESSOR">Professor</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-fg">
                Situação
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                >
                  <option value="">Todas as situações</option>
                  <option value="OK">Em dia</option>
                  <option value="PENDING">Com pendência</option>
                </select>
              </label>
            </div>
          }
        />

        {isLoading ? (
          <div
            className="flex min-h-48 items-center justify-center"
            role="status"
            aria-label="Carregando leitores"
          >
            <Loader />
          </div>
        ) : loadError ? (
          <EmptyState
            title="Não foi possível carregar os leitores."
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
          <ReadersTable
            readers={tableData.items}
            page={tableData.page}
            totalItems={tableData.totalItems}
            totalPages={tableData.totalPages}
            onPageChange={tableData.setPage}
          />
        )}
      </section>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Cadastrar leitor"
      >
        <CreateReaderForm
          onCancel={() => setIsFormOpen(false)}
          courseOptions={courses.map((course) => course.name)}
          onSubmit={handleCreateReader}
        />
      </Modal>
    </>
  );
}
