//Importação das paginas para definir as rotas
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterPage } from '../../features/auth/pages/RegisterPage';
import { GalleryPage } from '../pages/GalleryPage';
import { NotFoundPage } from '../pages/NotFoundPage';
//Rotas das paginas para fins de testes
import  Returns   from '../../features/Librarian/Returns/pages/ReturnsPage'
import Loans from '../../features/Librarian/LoansPage/LoanPage'
import BookCollection from '@/features/Librarian/BookCollection/BookCollection';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Definição das Rotas*/}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/galeria" element={<GalleryPage />} />
      {/* Rotas para fins de teste*/}
      <Route path="/devolucoes" element={<Returns/>} />
      <Route path="/emprestimos" element={<Loans/>} />
       <Route path="/acervo" element={<BookCollection/>} />

      <Route path="*" element={<NotFoundPage />} />


    </Routes>
  );
}

// ======================= Rotas ===================================
/**
 * Imports
 * import BookCollection from "./pages/BookCollection";
   import Loans from "./pages/Loans";
   import Returns from "./pages/Returns";


   Routes
  /**
      <Route element={<MainLayout profile="librarian" />}>
        <Route path="/gerenciamento/acervo" element={<BookCollection />} />
        <Route path="/gerenciamento/emprestimos" element={<Loans />} />
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
*/
