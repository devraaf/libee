import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../../../shared/components/branding/Logo';
import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import type { LoginFormData } from '../schemas/auth.schema';
import { useAuth } from '@/app/providers/auth/useAuth';
import { homePathByProfile } from '@/app/routes/homePathByProfile';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const registrationSuccess = location.state?.registrationSuccess === true;
  const redirect = (
    location.state as {
      from?: { pathname: string; search: string; hash: string };
    } | null
  )?.from;

  async function handleLogin(data: LoginFormData) {
    const session = await login(data);
    navigate(redirect ?? homePathByProfile[session.user.profile], {
      replace: true,
    });
  }
  return (
    <AuthLayout>
      <Logo heightClassName="h-36" />
      <p className="type-small text-fg">Entre com sua conta para continuar</p>
      {registrationSuccess && (
        <p className="type-small text-ok" role="status">
          Cadastro realizado com sucesso. Entre com sua conta para continuar.
        </p>
      )}
      <LoginForm onSubmit={handleLogin} />
      <p className="type-small text-muted">
        Não possui uma conta?{' '}
        <Link to="/cadastro" className="text-primary hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthLayout>
  );
}
