import { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/Button';
import { CourseCard } from '../components/CourseCard';
import CreateCourseForm from '../components/CreateCourseForm';
import type { Course, CourseFormValues } from '../types/course.model';

const mockCourses: Course[] = [
  {
    id: '1',
    name: 'Desenvolvimento de Software Multiplataforma',
    status: 'active',
  },
  {
    id: '2',
    name: 'Ciência de Dados',
    status: 'active',
  },
  {
    id: '3',
    name: 'Gestão Empresarial',
    status: 'active',
  },
  {
    id: '4',
    name: 'Gestão da Produção Industrial',
    status: 'active',
  },
  {
    id: '5',
    name: 'Comércio Exterior',
    status: 'active',
  },
  {
    id: '6',
    name: 'Design de Produto',
    status: 'inactive',
  },
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return courses;
    return courses.filter((course) =>
      course.name.toLowerCase().includes(query),
    );
  }, [courses, search]);

  const handleOpenCreateModal = () => {
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
    if (editingCourse) {
      setCourses((prev) =>
        prev.map((item) =>
          item.id === editingCourse.id ? { ...item, ...values } : item,
        ),
      );
      return;
    }

    const newCourse: Course = {
      id: crypto.randomUUID(),
      ...values,
    };
    setCourses((prev) => [newCourse, ...prev]);
  };

  const handleDeleteCourse = (target: Course) => {
    setCourses((prev) => prev.filter((item) => item.id !== target.id));
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

      {filteredCourses.length === 0 ? (
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
              onDelete={handleDeleteCourse}
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
                editingCourse
                  ? {
                      name: editingCourse.name,
                      status: editingCourse.status,
                    }
                  : undefined
              }
              submitLabel={isEditing ? 'Salvar alterações' : 'Confirmar'}
              submittingLabel={isEditing ? 'Salvando...' : 'Cadastrando...'}
              onCancel={handleCloseModal}
              onSubmit={handleSaveCourse}
            />
          </div>
        </div>
      )}
    </section>
  );
}