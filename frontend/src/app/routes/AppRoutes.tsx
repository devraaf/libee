import { Route, Routes } from 'react-router-dom';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterPage } from '../../features/auth/pages/RegisterPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { InstitutionalPage } from '../pages/InstitutionalPage';
import { MainLayout } from '../layout/MainLayout';
import { BookDetailsPage } from '@/features/book-details/pages/BooksDetailsPage';
import { GalleryPage } from '../pages/GalleryPage';
import LoansPage from '@/features/librarian/loans/pages/LoanPage';
import ReadersPage from '@/features/librarian/readers/pages/ReadersPage';
import ReturnsPage from '@/features/librarian/returns/pages/ReturnsPage';
import ReaderLoansPage from '@/features/reader/reader-loans/pages/ReaderLoansPage';
import { CatalogPage } from '@/features/reader/catalog/pages/CatalogPage';
import BookCollectionPage from '@/features/librarian/book-collection/pages/BookCollectionPage';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { useAuth } from '../providers/auth/useAuth';

function BookDetailsLayout() {
  const { session } = useAuth();
  const profile =
    session?.user.profile === 'LIBRARIAN' ? 'librarian' : 'reader';

  return <MainLayout profile={profile} />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout profile="public" />}>
        <Route path="/" element={<InstitutionalPage />} />
      </Route>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
      </Route>
      <Route path="/galeria" element={<GalleryPage />} />

      <Route element={<ProtectedRoute allowedProfiles={['READER']} />}>
        <Route element={<MainLayout profile="reader" />}>
          <Route path="/acervo" element={<CatalogPage />} />
          <Route path="/emprestimos" element={<ReaderLoansPage />} />
        </Route>
      </Route>
      <Route
        element={<ProtectedRoute allowedProfiles={['READER', 'LIBRARIAN']} />}
      >
        <Route element={<BookDetailsLayout />}>
          <Route path="/livros/:id" element={<BookDetailsPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedProfiles={['LIBRARIAN']} />}>
        <Route element={<MainLayout profile="librarian" />}>
          <Route
            path="/gerenciamento/acervo"
            element={<BookCollectionPage />}
          />
          <Route path="/gerenciamento/emprestimos" element={<LoansPage />} />
          <Route path="/gerenciamento/devolucoes" element={<ReturnsPage />} />
          <Route path="/gerenciamento/leitores" element={<ReadersPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
