import { useEffect, useState } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import {
  register,
  type RegisteredReader,
} from '@/features/auth/services/auth.service';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import type { RegisterFormData } from '@/features/auth/schemas/auth.schema';
import { listCourses } from '@/features/courses/services/course.service';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import Modal from '@/shared/components/ui/Modal';
import type { Course } from '@/shared/types/library';

interface RegisterReaderModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (reader: RegisteredReader) => void;
  initialValue?: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar os cursos.';
}

function compatibleEmail(value: string | undefined): string {
  const trimmedValue = value?.trim() ?? '';
  return trimmedValue.includes('@') ? trimmedValue : '';
}

export default function RegisterReaderModal({
  open,
  onClose,
  onSuccess,
  initialValue,
}: RegisterReaderModalProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!open) return;
    let active = true;

    listCourses()
      .then((result) => {
        if (active) {
          setCourses(result);
          setCoursesError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) setCoursesError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setIsLoadingCourses(false);
      });

    return () => {
      active = false;
    };
  }, [open, retry]);

  async function handleRegister(data: RegisterFormData) {
    const reader = await register(data);
    onSuccess(reader);
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Cadastrar leitor" size="xl">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <div className="flex items-start gap-3 rounded-lg border border-info-line bg-info-bg p-3 text-info">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <p className="type-small">
            O cadastro ficará ativo imediatamente. Defina uma senha inicial e
            repasse-a ao leitor para o primeiro acesso.
          </p>
        </div>

        {isLoadingCourses ? (
          <div
            className="flex min-h-32 items-center justify-center gap-2 text-muted"
            role="status"
          >
            <Loader size={18} className="animate-spin" aria-hidden="true" />
            <span className="type-small">Carregando cursos...</span>
          </div>
        ) : coursesError ? (
          <EmptyState
            title="Não foi possível carregar os cursos."
            description={coursesError}
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCoursesError(null);
                  setIsLoadingCourses(true);
                  setRetry((current) => current + 1);
                }}
              >
                Tentar novamente
              </Button>
            }
          />
        ) : (
          <RegisterForm
            key={initialValue?.trim() ?? ''}
            courses={courses}
            initialName={
              compatibleEmail(initialValue) ? '' : (initialValue?.trim() ?? '')
            }
            initialEmail={compatibleEmail(initialValue)}
            submitLabel="Cadastrar leitor"
            autoFocusName
            onSubmit={handleRegister}
          />
        )}
      </div>
    </Modal>
  );
}
