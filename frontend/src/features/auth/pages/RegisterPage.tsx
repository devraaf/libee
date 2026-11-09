import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../../../shared/components/branding/Logo';
import { AuthLayout } from '../components/AuthLayout';
import { RegisterForm } from '../components/RegisterForm';
import type { RegisterFormData } from '../schemas/auth.schema';
import type { Course } from '@/shared/types/library';
import { register } from '../services/auth.service';
import { listCourses } from '@/features/courses/services/course.service';

interface RegisterPageProps {
  courses?: Course[];
  onSubmit?: (data: RegisterFormData) => void | Promise<void>;
}

export function RegisterPage({ courses, onSubmit }: RegisterPageProps) {
  const navigate = useNavigate();
  const [loadedCourses, setLoadedCourses] = useState<Course[]>([]);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const availableCourses = courses ?? loadedCourses;

  useEffect(() => {
    if (courses !== undefined) return;

    let active = true;
    listCourses()
      .then((result) => {
        if (active) setLoadedCourses(result);
      })
      .catch(() => {
        if (active) {
          setCoursesError('Não foi possível carregar a lista de cursos.');
        }
      });

    return () => {
      active = false;
    };
  }, [courses]);

  async function handleRegister(data: RegisterFormData) {
    if (onSubmit) {
      await onSubmit(data);
    } else {
      await register(data);
    }
    navigate('/entrar', { state: { registrationSuccess: true } });
  }

  return (
    <AuthLayout>
      <Logo heightClassName="h-36" />
      <p className="type-small text-fg">Crie sua conta para começar</p>
      {coursesError && (
        <p className="type-small text-danger" role="alert">
          {coursesError}
        </p>
      )}
      <RegisterForm courses={availableCourses} onSubmit={handleRegister} />
      <p className="type-small text-muted">
        Já possui uma conta?{' '}
        <Link to="/entrar" className="text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
