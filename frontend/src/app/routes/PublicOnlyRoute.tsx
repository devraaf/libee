import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/app/providers/auth/useAuth';
import { homePathByProfile } from './homePathByProfile';

export function PublicOnlyRoute() {
  const { session } = useAuth();

  if (session) {
    return <Navigate to={homePathByProfile[session.user.profile]} replace />;
  }

  return <Outlet />;
}
