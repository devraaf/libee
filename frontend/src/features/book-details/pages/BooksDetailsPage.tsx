import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/app/providers/auth/useAuth';
import { homePathByProfile } from '@/app/routes/homePathByProfile';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Loader } from '@/shared/components/ui/loader/Loader';
import { ApiError } from '@/shared/api/api-error';
import { getBookDetails } from '@/features/book-details/services/books.service';
import type { BookDisplay, Copy } from '@/shared/types/library';
import BookDetails from '../components/BookDetails';

type BookDetailsState =
  | { status: 'loading'; bookId: number | null }
  | { status: 'loaded'; bookId: number; book: BookDisplay; copies: Copy[] }
  | { status: 'not-found'; bookId: number }
  | { status: 'error'; bookId: number; message: string };

export function BookDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const returnPath = session
    ? homePathByProfile[session.user.profile]
    : '/acervo';
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState<BookDetailsState>({
    status: 'loading',
    bookId: null,
  });
  const bookId = Number(id);
  const isValidBookId = Number.isInteger(bookId) && bookId > 0;
  const handleBack = () => {
    if (location.key === 'default') {
      navigate(returnPath);
      return;
    }
    navigate(-1);
  };

  useEffect(() => {
    let active = true;

    if (!isValidBookId) return;

    async function loadBookDetails() {
      try {
        const { book, copies } = await getBookDetails(bookId);
        if (active) setState({ status: 'loaded', bookId, book, copies });
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiError && error.status === 404) {
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
              <Button onClick={handleBack} variant="outline">
                Voltar à página anterior
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
            <Button onClick={handleBack} variant="outline">
              Voltar à página anterior
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

  return (
    <BookDetails book={state.book} copies={state.copies} onBack={handleBack} />
  );
}
