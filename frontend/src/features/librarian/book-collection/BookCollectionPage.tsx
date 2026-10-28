import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import SearchFilterBar from '../../../shared/components/ui/SearchFilterBar';
import { listBooks, listCopies } from '../../catalog/services/books.service';
import { mockBooks, mockCopies } from '../../../shared/mocks/data';
import {
  BookCollectionTable,
  type BookCollectionItem,
} from './components/BookCollectionTable';
import RegisterBookModal from './components/RegisterBookModal';
import EditBookModal from './components/EditBookModal';
import DeleteBookModal from './components/DeleteBookModal';

export default function BookCollectionPage() {
  const [books, setBooks] = useState<BookCollectionItem[]>([]);
  const [search, setSearch] = useState('');
  
  // Modais e Toasts
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState<number | null>(null);
  const [deletingBook, setDeletingBook] = useState<BookCollectionItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadAcervo = async () => {
    try {
      const [result, copies] = await Promise.all([
        listBooks({ page: 1, size: 50 }),
        listCopies(),
      ]);

      const savedBooks = localStorage.getItem('booksList');
      const allBooks = savedBooks ? JSON.parse(savedBooks) : result.items;

      const savedCopies = localStorage.getItem('copiesList');
      const allCopies = savedCopies ? JSON.parse(savedCopies) : copies;

      const formatted = allBooks.map((b: any) => {
        const bookCopies = allCopies.filter((c: any) => c.bookId === b.id);
        const hasBorrowed = bookCopies.some((c: any) => c.status === 'ON_LOAN');

        return {
          id: b.id,
          title: b.title,
          authors: Array.isArray(b.authors)
            ? b.authors.map((a: any) => (typeof a === 'string' ? a : a.name)).join(', ')
            : b.authors,
          isbn: b.isbn,
          category: b.category?.name || 'Geral',
          copies: bookCopies.length,
          hasBorrowedCopies: hasBorrowed,
        };
      });

      setBooks(formatted);
    } catch {
      // Fallback para os dados mockados em caso de erro
      setBooks([]);
    }
  };

  useEffect(() => {
    void loadAcervo();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Exclusão de Livro
  const handleConfirmDelete = () => {
    if (!deletingBook) return;

    const savedBooks = localStorage.getItem('booksList');
    const booksList = savedBooks ? JSON.parse(savedBooks) : mockBooks;
    const filteredBooks = booksList.filter((b: any) => b.id !== deletingBook.id);
    localStorage.setItem('booksList', JSON.stringify(filteredBooks));

    const savedCopies = localStorage.getItem('copiesList');
    const copiesList = savedCopies ? JSON.parse(savedCopies) : mockCopies;
    const filteredCopies = copiesList.filter((c: any) => c.bookId !== deletingBook.id);
    localStorage.setItem('copiesList', JSON.stringify(filteredCopies));

    showToast(`Livro "${deletingBook.title}" e seus exemplares foram excluídos.`);
    setDeletingBook(null);
    void loadAcervo();
  };

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 relative">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toastMessage}
        </div>
      )}

      <PageHeader
        title="Acervo"
        subtitle="Gerencie livros e exemplares da biblioteca"
        action={
          <Button type="button" leftIcon={<Plus size={16} />} onClick={() => setIsRegisterOpen(true)}>
            Cadastrar livro
          </Button>
        }
      />

      <SearchFilterBar
        placeholder="Pesquise por título, autor ou ISBN..."
        value={search}
        onChange={setSearch}
      />

      <BookCollectionTable
        books={books.filter((b) => b.title.toLowerCase().includes(search.toLowerCase()))}
        page={1}
        totalItems={books.length}
        totalPages={1}
        onPageChange={() => {}}
        onEditBook={(id) => setEditingBookId(id)}
        onDeleteBook={(book) => setDeletingBook(book)}
      />

      {/* Modais */}
      <RegisterBookModal
        open={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={(b) => {
          showToast(`Livro "${b.title}" cadastrado com sucesso!`);
          void loadAcervo();
        }}
      />

      <EditBookModal
        open={!!editingBookId}
        bookId={editingBookId}
        onClose={() => setEditingBookId(null)}
        onSuccess={(title) => {
          showToast(`Livro "${title}" atualizado com sucesso!`);
          void loadAcervo();
        }}
      />

      <DeleteBookModal
        open={!!deletingBook}
        bookTitle={deletingBook?.title || null}
        onClose={() => setDeletingBook(null)}
        onConfirm={handleConfirmDelete}
      />
    </section>
  );
}