import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/auth/useAuth';
import { Button } from '../../shared/components/ui/Button';
import Modal from '../../shared/components/ui/Modal';
import { useDisclosure } from '../../shared/hooks/useDisclosure';
import { Footer } from './Footer';
import { Header, type HeaderProfile } from './Header';

export interface MainLayoutProps {
  profile: HeaderProfile;
  onSignOut?: () => void;
}

export function MainLayout({ profile, onSignOut }: MainLayoutProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const signOutModal = useDisclosure();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function confirmSignOut() {
    setIsSigningOut(true);
    setSignOutError(null);

    try {
      await logout();
      onSignOut?.();
      signOutModal.close();
      navigate('/entrar', { replace: true });
    } catch (error) {
      setSignOutError(
        error instanceof Error
          ? error.message
          : 'Não foi possível encerrar a sessão.',
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  function openSignOutConfirmation() {
    setSignOutError(null);
    signOutModal.open();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <Header
        profile={profile}
        onSignOut={profile === 'public' ? undefined : openSignOutConfirmation}
      />
      <main className="flex-1">
        {signOutError && (
          <p className="type-small px-4 pt-4 text-danger" role="alert">
            {signOutError}
          </p>
        )}
        <Outlet />
      </main>
      <Footer />
      <Modal
        isOpen={signOutModal.isOpen}
        onClose={signOutModal.close}
        title="Encerrar sessão"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={signOutModal.close}
              disabled={isSigningOut}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              leftIcon={<LogOut size={16} aria-hidden="true" />}
              onClick={confirmSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? 'Saindo...' : 'Sair'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 text-center">
          <p className="type-body text-muted">
            Tem certeza que deseja encerrar sua sessão?
          </p>
          {signOutError && (
            <p className="type-small text-danger" role="alert">
              {signOutError}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
