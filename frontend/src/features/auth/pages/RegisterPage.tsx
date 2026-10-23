import { Link } from 'react-router-dom';
import { Logo } from '../../../shared/components/branding/Logo';
import { AuthLayout } from '../components/AuthLayout';
import { RegisterForm } from '../components/RegisterForm';
import type { RegisterFormData } from '../schemas/auth.schema';
import type { Course } from '../types/course';

interface RegisterPageProps {
  courses?: Course[];
  onSubmit?: (data: RegisterFormData) => void | Promise<void>;
}

export function RegisterPage({ courses, onSubmit }: RegisterPageProps) {
  return (
    <AuthLayout>
      <Logo heightClassName="h-36" />
      <p className="type-small text-fg">Crie sua conta para começar</p>
      <RegisterForm courses={courses} onSubmit={onSubmit} />
      <p className="type-small text-muted">
        Já possui uma conta?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
