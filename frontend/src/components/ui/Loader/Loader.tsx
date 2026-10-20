import './Loader.css';

export function Loader() {
  return (
    <div className="loader">
      <div className="book">
        <div className="page"></div>
        <div className="page page2"></div>
      </div>
    </div>
  );
}

/**
 * COMPONENTE: Loader
 * 
 * Localização dos arquivos:
 *  - Estilos (CSS): src/components/ui/Loader/Loader.css
 *  - Componente:    src/components/ui/Loader/Loader.tsx
 * 
 * uso em uma página de catalogo como exemplo:
 * 
 * ```tsx
 * import { useState, useEffect } from 'react';
 * import { Loader } from '@/components/ui/Loader/Loader';
 * 
 * export function CatalogPage() {
 *   const [isLoading, setIsLoading] = useState(true);
 *   const [books, setBooks] = useState([]);
 * 
 *   useEffect(() => {
 *     // Busca os livros na API
 *     fetchBooks().then((data) => {
 *       setBooks(data);
 *       setIsLoading(false); // Desativa o loader após carregar
 *     });
 *   }, []);
 * 
 * 
 *   // 1. Exibição em tela cheia / seção centralizada enquanto carrega:
 *   if (isLoading) {
 *     return (
 *       <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
 *         <Loader/>
 *       </div>
 *     );
 *   }
 * 
 * 
 * 
 *   // 2. Renderização do catálogo quando os dados estiverem prontos:
 *   return (
 *     <div className="catalog-grid">
 *       {books.map((book) => (
 *         <BookCard book="{book}" key="{book.id}"/>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
