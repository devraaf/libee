import { GraduationCap, Pencil, Trash2 } from 'lucide-react';
import type { Course } from '../types/course.model';

interface CourseCardProps {
  course: Course;
  onEdit?: (course: Course) => void;
  onDelete?: (course: Course) => void;
}

export function CourseCard({ course, onEdit, onDelete }: CourseCardProps) {
  return (
    <article className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex min-w-0 items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <GraduationCap size={22} aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <h2 className="truncate font-semibold leading-snug text-fg">
            {course.name}
          </h2>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit?.(course)}
          aria-label={`Editar ${course.name}`}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-fg"
        >
          <Pencil size={17} />
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(course)}
          aria-label={`Excluir ${course.name}`}
          className="rounded-lg p-2 text-danger/80 transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  );
}