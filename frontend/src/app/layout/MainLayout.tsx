import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { Header, type HeaderProfile } from './Header';

export interface MainLayoutProps {
  profile: HeaderProfile;
  onSignOut?: () => void;
}

export function MainLayout({ profile, onSignOut }: MainLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <Header profile={profile} onSignOut={onSignOut} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}