import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { ApiError } from '../../../../shared/api/api-error';
import { Button } from '../../../../shared/components/ui/Button';
import { CourseCard } from '../components/CourseCard';
import CreateCourseForm from '../components/CreateCourseForm';
import {
  createCourse,
  deleteCourse,
  listCourses,
} from '../services/courses.service';
import type { Course, CourseFormValues } from '../types/course.model';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  async function loadCourses() {
    setIsLoading(true);
    setPageError(null);

    try {
      const data = await listCourses();
      setCourses(
        data.map((course) => ({
          id: String(course.id),
          name: course.name,
        })),
      );
    } catch (error) {
      setPageError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível carregar os cursos.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return courses;
    return courses.filter((course) =>
      course.name.toLowerCase().includes(query),
    );
  }, [courses, search]);

  const handleOpenCreateModal = () => {
    setActionNotice(null);
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course: Course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const handleSaveCourse = async (values: CourseFormValues) => {
    setPageError(null);
    setActionNotice(null);

    if (editingCourse) {
      setActionNotice(
        'A edição de cursos ainda não está disponível na API do backend.',
      );
      return;
    }

    const created = await createCourse({ name: values.name.trim() });
    const newCourse: Course = {
      id: String(created.id),
      name: created.name,
    };
    setCourses((prev) => [newCourse, ...prev]);
  };

  const handleRequestDeleteCourse = (target: Course) => {
    setPageError(null);
    setActionNotice(null);
    setCourseToDelete(target);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setCourseToDelete(null);
  };

  const handleConfirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    setPageError(null);
    setActionNotice(null);
    setIsDeleting(true);

    try {
      await deleteCourse(courseToDelete.id);
      setCourses((prev) => prev.filter((course) => course.id !== courseToDelete.id));
      setCourseToDelete(null);
      setActionNotice('Curso excluído com sucesso.');
    } catch (error) {
      setPageError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível excluir o curso.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const isEditing = Boolean(editingCourse);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-bold text-fg">Cursos</h1>
          <p className="mt-1 text-sm text-muted">
            Gerencie os cursos disponíveis para vínculo de leitores.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 self-start"
        >
          <Plus size={18} />
          Cadastrar curso
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar curso..."
            className="w-full rounded-lg border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-fg placeholder:text-subtle focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {pageError && (
        <div
          role="alert"
          className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          <span>{pageError}</span>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadCourses()}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {actionNotice && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted"
        >
          {actionNotice}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center text-sm text-muted">
          Carregando cursos...
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center text-sm text-muted">
          Nenhum curso encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={handleOpenEditModal}
              onDelete={handleRequestDeleteCourse}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-course-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="modal-course-title"
                className="text-lg font-bold text-fg"
              >
                {isEditing ? 'Editar curso' : 'Cadastrar curso'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                aria-label="Fechar modal"
                className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-fg"
              >
                <X size={18} />
              </button>
            </div>

            <CreateCourseForm
              initialData={
                editingCourse ? { name: editingCourse.name } : undefined
              }
              submitLabel={isEditing ? 'Salvar alterações' : 'Confirmar'}
              submittingLabel={isEditing ? 'Salvando...' : 'Cadastrando...'}
              onCancel={handleCloseModal}
              onSubmit={handleSaveCourse}
            />
          </div>
        </div>
      )}

      {courseToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-course-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2
                id="delete-course-title"
                className="text-lg font-bold text-fg"
              >
                Confirmar exclusão
              </h2>
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={isDeleting}
                aria-label="Fechar confirmação"
                className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-fg disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-muted">
              Tem certeza que deseja excluir o curso{' '}
              <strong className="text-fg">{courseToDelete.name}</strong>? Essa
              ação não poderá ser desfeita.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDeleteCourse}
                disabled={isDeleting}
                className="bg-danger text-white hover:bg-danger/90"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}