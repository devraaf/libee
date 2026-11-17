import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { UserProfile } from '@/shared/schemas/enums.schema';
import { useAuth } from '@/app/providers/auth/useAuth';
import { homePathByProfile } from './homePathByProfile';

interface ProtectedRouteProps {
  allowedProfiles?: readonly UserProfile[];
  children?: ReactNode;
}

export function ProtectedRoute({
  allowedProfiles,
  children,
}: ProtectedRouteProps) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/entrar" state={{ from: location }} replace />;
  }

  if (allowedProfiles && !allowedProfiles.includes(session.user.profile)) {
    return <Navigate to={homePathByProfile[session.user.profile]} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
