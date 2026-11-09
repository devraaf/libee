import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Loader } from '@/shared/components/ui/loader/Loader';
import type { BookListItem, Copy } from '@/shared/types/library';
import { MockServiceError } from '@/shared/mocks/service-utils';
import {
  getBook,
  listActiveCopies,
} from '@/features/reader/catalog/services/books.service';
import BookDetails from '../components/BookDetails';

type BookDetailsState =
  | { status: 'loading'; bookId: number | null }
  | { status: 'loaded'; bookId: number; book: BookListItem; copies: Copy[] }
  | { status: 'not-found'; bookId: number }
  | { status: 'error'; bookId: number; message: string };

export function BookDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState<BookDetailsState>({
    status: 'loading',
    bookId: null,
  });
  const bookId = Number(id);
  const isValidBookId = Number.isInteger(bookId) && bookId > 0;

  useEffect(() => {
    let active = true;

    if (!isValidBookId) return;

    async function loadBookDetails() {
      try {
        const [book, copies] = await Promise.all([
          getBook(bookId),
          listActiveCopies(bookId),
        ]);
        if (active) setState({ status: 'loaded', bookId, book, copies });
      } catch (error) {
        if (!active) return;
        if (error instanceof MockServiceError && error.code === 'NOT_FOUND') {
          setState({ status: 'not-found', bookId });
          return;
        }
        setState({
          status: 'error',
          bookId,
          message:
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os detalhes do livro.',
        });
      }
    }

    void loadBookDetails();
    return () => {
      active = false;
    };
  }, [bookId, id, isValidBookId, retryCount]);

  if (!isValidBookId || state.bookId !== bookId || state.status === 'loading') {
    if (!isValidBookId) {
      return (
        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
          <EmptyState
            title="Livro não encontrado"
            description="O endereço do livro está incorreto."
            action={
              <Button onClick={() => navigate('/acervo')} variant="outline">
                Voltar para o acervo
              </Button>
            }
          />
        </section>
      );
    }

    return (
      <section
        className="flex min-h-96 items-center justify-center"
        role="status"
        aria-label="Carregando detalhes do livro"
      >
        <Loader />
      </section>
    );
  }

  if (state.status === 'not-found') {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
        <EmptyState
          title="Livro não encontrado"
          description="O livro pode ter sido removido do acervo ou o endereço está incorreto."
          action={
            <Button onClick={() => navigate('/acervo')} variant="outline">
              Voltar para o acervo
            </Button>
          }
        />
      </section>
    );
  }

  if (state.status === 'error') {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
        <EmptyState
          title="Não foi possível carregar o livro"
          description={state.message}
          action={
            <Button
              onClick={() => {
                setState({ status: 'loading', bookId });
                setRetryCount((count) => count + 1);
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      </section>
    );
  }

  return <BookDetails book={state.book} copies={state.copies} />;
}
