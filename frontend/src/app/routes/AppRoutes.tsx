import { Route, Routes } from 'react-router-dom';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterPage } from '../../features/auth/pages/RegisterPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { InstitutionalPage } from '../pages/InstitutionalPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { MainLayout } from '../layout/MainLayout';
import { BookDetailsPage } from '@/features/catalog/pages/BooksDetailsPage';
import { GalleryPage } from '../pages/GalleryPage';
import LoansPage from '@/features/librarian/loans/LoanPage';
import BookCollectionPage from '@/features/librarian/book-collection/BookCollectionPage';
import ReadersPage from '@/features/librarian/Readers/pages/ReadersPage';
import ReturnsPage from '@/features/librarian/Returns/pages/ReturnsPage';
import ReaderLoansPage from '@/features/reader/reader-loans/pages/reader-loans-page'
import { CatalogPage } from '@/features/catalog/pages/CatalogPage';


export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout profile="public" />}>
        <Route path="/" element={<InstitutionalPage />} />
      </Route>
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/galeria" element={<GalleryPage />} />
      
      <Route element={<MainLayout profile="reader" />}>
        <Route path="/acervo" element={<CatalogPage />} />
        <Route
          path="/emprestimos"
          element={
          <ReaderLoansPage readerId={4}/>} />  {/* id do leitor de acordo com mock e service, para teste */}
        <Route path="/livros/:id" element={<BookDetailsPage />} />
      </Route>
      <Route element={<MainLayout profile="librarian" />}>
        <Route path="/gerenciamento/acervo" element={<BookCollectionPage />} />
        <Route path="/gerenciamento/emprestimos" element={<LoansPage />} />
        <Route path="/gerenciamento/devolucoes" element={<ReturnsPage />} />
        <Route path="/gerenciamento/leitores" element={<ReadersPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
