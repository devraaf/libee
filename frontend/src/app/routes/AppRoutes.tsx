import { Route, Routes } from 'react-router-dom';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterPage } from '../../features/auth/pages/RegisterPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { InstitutionalPage } from '../pages/InstitutionalPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { MainLayout } from '../layout/MainLayout';
import { GalleryPage } from '../pages/GalleryPage';
import LoansPage from '@/features/Librarian/LoansPage/LoanPage';
import BookCollectionPage from '@/features/Librarian/BookCollection/BookCollection';
import Returns from '@/features/Librarian/Returns/pages/ReturnsPage';
import BookDetailsPage from '../pages/BookDetailsPage';
import Reader from '@/features/Readers/pages/ReadersPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout profile="public" />}>
        <Route path="/" element={<InstitutionalPage />} />
      </Route>
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/galeria" element={<GalleryPage />} />
      
      {/* Visão do Leitor */}
      <Route element={<MainLayout profile="reader" />}>
        <Route
          path="/acervo"
          element={
            <PlaceholderPage
              title="Acervo"
              description="Consulte os livros disponíveis na biblioteca."
            />
          }
        />
        <Route
          path="/emprestimos"
          element={
            <PlaceholderPage
              title="Empréstimos"
              description="Acompanhe seus empréstimos e prazos de devolução."
            />
          }
        />
        <Route path="/livros/:id" element={<BookDetailsPage />} />
      </Route>

      <Route element={<MainLayout profile="librarian" />}>
        <Route path="/gerenciamento/acervo" element={<BookCollectionPage />} />
        <Route path="/gerenciamento/emprestimos" element={<LoansPage />} />
        <Route path="/gerenciamento/devolucoes" element={<Returns />} />
        <Route
          path="/gerenciamento/leitores"
          element={
            <PlaceholderPage
              title="Leitores"
              description="Consulte e gerencie os leitores cadastrados."
            />
          }
        />
      </Route>
      
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}