import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/Button';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { Loader } from '../../../../shared/components/ui/Loader/Loader';
import Modal from '../../../../shared/components/ui/Modal';
import { PageHeader } from '../../../../shared/components/ui/PageHeader';
import SearchFilterBar from '../../../../shared/components/ui/SearchFilterBar';
import { listCourses } from '../../../catalog/services/catalog.service';
import { listLoans } from '../../../loans/services/loans.service';
import { createReader, listReaders } from '../services/readers.service';
import type { AffiliationType } from '../../../../shared/schemas/enums.schema';
import type { Course, Loan, Reader } from '../../../../shared/types/library';
import { ReaderStats } from '../components/ReadersStats';
import CreateReaderForm from '../components/CreateReaderForm';
import { ReadersTable, type ReadersItem } from '../components/ReadersTable';
import type { ReaderFormValues } from '../types/reader.model';

const PAGE_SIZE = 10;

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
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [readers, setReaders] = useState<ReadersItem[]>([]);
  const [stats, setStats] = useState<ReaderStatsData>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

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

  const filteredReaders = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return readers;
    return readers.filter(
      (reader) =>
        reader.name.toLocaleLowerCase().includes(query) ||
        reader.email.toLocaleLowerCase().includes(query) ||
        reader.course?.name.toLocaleLowerCase().includes(query),
    );
  }, [readers, search]);

  const totalPages = Math.max(1, Math.ceil(filteredReaders.length / PAGE_SIZE));
  const visibleReaders = filteredReaders.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

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
    setPage(1);
    setRetry((current) => current + 1);
  }

  return (
    <>
      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
        <PageHeader
          title="Leitores"
          subtitle="Consulte os leitores cadastrados e o histórico de empréstimos de cada um"
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
          placeholder="Buscar por nome, e-mail ou curso..."
          value={search}
          onChange={handleSearchChange}
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
            readers={visibleReaders}
            page={page}
            totalItems={filteredReaders.length}
            totalPages={totalPages}
            onPageChange={setPage}
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
