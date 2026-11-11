import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getBookDetails } from '@/features/book-details/services/books.service';
import type { Category, Copy } from '@/shared/types/library';
import { ApiError } from '@/shared/api/api-error';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Input } from '@/shared/components/ui/Input';
import { Loader } from '@/shared/components/ui/loader/Loader';
import Modal from '@/shared/components/ui/Modal';
import { Select } from '@/shared/components/ui/Select';
import { deleteManagedCopy } from '../services/book-management.service';

interface EditBookModalProps {
  open: boolean;
  bookId: number | null;
  categories: Category[];
  onClose: () => void;
  onCopyDeleted: () => void;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar os dados do livro.';
}

export default function EditBookModal({
  open,
  bookId,
  categories,
  onClose,
  onCopyDeleted,
}: EditBookModalProps) {
  const [book, setBook] = useState<
    Awaited<ReturnType<typeof getBookDetails>>['book'] | null
  >(null);
  const [copies, setCopies] = useState<Copy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedBookId, setLoadedBookId] = useState<number | null>(null);
  const [copyToDelete, setCopyToDelete] = useState<Copy | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [blockedAccessionNumbers, setBlockedAccessionNumbers] = useState<
    string[]
  >([]);
  const [isDeletingCopy, setIsDeletingCopy] = useState(false);
  const [authorInput, setAuthorInput] = useState('');
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (!open || bookId === null) return;
    let active = true;

    getBookDetails(bookId)
      .then(({ book: bookDetails, copies: bookCopies }) => {
        if (!active) return;
        setBook(bookDetails);
        setCopies(bookCopies);
        setAuthorInput('');
        setCurrentStep(1);
        setLoadError(null);
        setLoadedBookId(bookId);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(getErrorMessage(error));
          setLoadedBookId(bookId);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [bookId, open]);

  const isLoadingBook = isLoading || loadedBookId !== bookId;
  const visibleLoadError = loadedBookId === bookId ? loadError : null;
  const visibleBook = loadedBookId === bookId ? book : null;

  function updateBook<K extends keyof NonNullable<typeof visibleBook>>(
    field: K,
    value: NonNullable<typeof visibleBook>[K],
  ) {
    setBook((current) => (current ? { ...current, [field]: value } : current));
  }

  function handleAddAuthor() {
    const author = authorInput.trim();
    if (!author || !visibleBook) return;
    if (
      visibleBook.authors.some(
        (existing) =>
          existing.toLocaleLowerCase() === author.toLocaleLowerCase(),
      )
    ) {
      return;
    }

    updateBook('authors', [...visibleBook.authors, author]);
    setAuthorInput('');
  }

  async function handleDeleteCopy() {
    if (!book || !copyToDelete) return;
    if (copyToDelete.status === 'ON_LOAN') return;
    if (copyToDelete.id < 0) {
      setCopies((current) =>
        current.filter((copy) => copy.id !== copyToDelete.id),
      );
      setCopyToDelete(null);
      return;
    }

    setIsDeletingCopy(true);
    setDeleteError(null);
    setBlockedAccessionNumbers([]);
    try {
      await deleteManagedCopy(book.id, copyToDelete.id);
      setCopies((current) =>
        current.filter((copy) => copy.id !== copyToDelete.id),
      );
      setCopyToDelete(null);
      onCopyDeleted();
    } catch (error) {
      setDeleteError(getErrorMessage(error));
      if (error instanceof ApiError) {
        setBlockedAccessionNumbers(error.accessionNumbers);
      }
    } finally {
      setIsDeletingCopy(false);
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Editar livro"
      size="full"
      header={
        <div className="mb-4 flex items-center gap-6 border-b border-line pb-4 text-xs font-semibold">
          <span className={currentStep === 1 ? 'text-primary' : 'text-muted'}>
            1. Dados do livro
          </span>
          <span className={currentStep === 2 ? 'text-primary' : 'text-muted'}>
            2. Exemplares
          </span>
        </div>
      }
      footer={
        <div className="flex w-full justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (currentStep === 2) setCurrentStep(1);
              else onClose();
            }}
          >
            {currentStep === 1 ? 'Cancelar' : 'Voltar'}
          </Button>
          {currentStep === 1 ? (
            <Button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={isLoadingBook || Boolean(visibleLoadError)}
            >
              Continuar
            </Button>
          ) : (
            <Button type="button" disabled>
              Salvar alterações
            </Button>
          )}
        </div>
      }
    >
      {isLoadingBook ? (
        <div
          className="flex min-h-48 items-center justify-center"
          role="status"
          aria-label="Carregando dados do livro"
        >
          <Loader />
        </div>
      ) : visibleLoadError ? (
        <EmptyState
          title="Não foi possível carregar o livro."
          description={visibleLoadError}
        />
      ) : visibleBook ? (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {currentStep === 1 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Título"
                  value={visibleBook.title}
                  onChange={(event) => updateBook('title', event.target.value)}
                />
                <Input
                  label="ISBN"
                  value={visibleBook.isbn}
                  onChange={(event) => updateBook('isbn', event.target.value)}
                />
                <Select
                  label="Categoria"
                  value={
                    visibleBook.category.id
                      ? String(visibleBook.category.id)
                      : 'current-category'
                  }
                  onChange={(event) => {
                    const category = categories.find(
                      ({ id }) => String(id) === event.target.value,
                    );
                    if (category) updateBook('category', category);
                  }}
                  options={[
                    ...(!visibleBook.category.id
                      ? [
                          {
                            value: 'current-category',
                            label: visibleBook.category.name,
                          },
                        ]
                      : []),
                    ...categories.map(({ id, name }) => ({
                      value: String(id),
                      label: name,
                    })),
                  ]}
                  placeholder="Selecione uma categoria"
                />
              </div>

              <section
                aria-label="Autores do livro"
                className="flex flex-col gap-2 text-sm"
              >
                <span>Autores</span>
                <ul className="flex flex-wrap gap-2">
                  {visibleBook.authors.map((author, index) => (
                    <li
                      key={`${author}-${index}`}
                      className="inline-flex items-center gap-2 rounded-md bg-chip px-2.5 py-1 text-xs"
                    >
                      {author}
                      <button
                        type="button"
                        aria-label={`Remover autor ${author}`}
                        onClick={() =>
                          updateBook(
                            'authors',
                            visibleBook.authors.filter(
                              (_, authorIndex) => authorIndex !== index,
                            ),
                          )
                        }
                        className="text-muted hover:text-danger"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <Input
                    aria-label="Nome do autor"
                    placeholder="Nome do autor"
                    value={authorInput}
                    onChange={(event) => setAuthorInput(event.target.value)}
                    containerClassName="min-w-0 flex-1"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleAddAuthor();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddAuthor}
                    disabled={!authorInput.trim()}
                  >
                    Adicionar
                  </Button>
                </div>
              </section>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Editora"
                  value={visibleBook.publisher ?? ''}
                  onChange={(event) =>
                    updateBook('publisher', event.target.value || null)
                  }
                />
                <Input
                  label="Local de publicação"
                  value={visibleBook.publicationPlace ?? ''}
                  onChange={(event) =>
                    updateBook('publicationPlace', event.target.value || null)
                  }
                />
                <Input
                  label="Edição"
                  value={visibleBook.edition ?? ''}
                  onChange={(event) =>
                    updateBook('edition', event.target.value || null)
                  }
                />
                <Input
                  label="Ano de publicação"
                  type="number"
                  value={visibleBook.publicationDate ?? ''}
                  onChange={(event) =>
                    updateBook('publicationDate', event.target.value || null)
                  }
                />
                <Input
                  label="Número de páginas"
                  type="number"
                  min="1"
                  value={visibleBook.pageCount ?? ''}
                  onChange={(event) =>
                    updateBook(
                      'pageCount',
                      event.target.value ? Number(event.target.value) : null,
                    )
                  }
                />
                <Input
                  label="Capa"
                  type="url"
                  value={visibleBook.coverImageUrl ?? ''}
                  onChange={(event) =>
                    updateBook('coverImageUrl', event.target.value || null)
                  }
                />
              </div>

              <label className="type-label flex flex-col gap-1.5 text-fg">
                Resumo
                <textarea
                  rows={4}
                  value={visibleBook.summary ?? ''}
                  onChange={(event) =>
                    updateBook('summary', event.target.value || null)
                  }
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-fg focus:border-line-strong focus:outline-none focus:ring-1 focus:ring-line-strong"
                />
              </label>
            </>
          ) : (
            <section
              aria-label="Exemplares do livro"
              className="flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Exemplares</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCopies((current) => [
                      ...current,
                      {
                        id: Math.min(0, ...current.map(({ id }) => id)) - 1,
                        bookId: visibleBook.id,
                        accessionNumber: '',
                        physicalLocation: '',
                        status: 'AVAILABLE',
                      },
                    ])
                  }
                  leftIcon={<Plus size={14} />}
                >
                  Adicionar exemplar
                </Button>
              </div>
              {copies.length === 0 && (
                <p className="text-sm text-muted">
                  Nenhum exemplar cadastrado. Adicione um exemplar se
                  necessário.
                </p>
              )}
              {copies.map((copy, index) => (
                <div
                  key={copy.id}
                  className="grid gap-3 rounded-lg border border-line p-3 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <label className="flex flex-col gap-1 text-sm">
                    <span>
                      Tombo *{' '}
                      {copy.status === 'ON_LOAN' && (
                        <span className="text-muted">(emprestado)</span>
                      )}
                    </span>
                    <input
                      type="text"
                      aria-label={`Tombo do exemplar ${index + 1}`}
                      value={copy.accessionNumber}
                      readOnly={copy.status === 'ON_LOAN'}
                      onChange={(event) =>
                        setCopies((current) =>
                          current.map((item) =>
                            item.id === copy.id
                              ? {
                                  ...item,
                                  accessionNumber: event.target.value,
                                }
                              : item,
                          ),
                        )
                      }
                      className="rounded-lg border border-line p-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    Localização física
                    <input
                      type="text"
                      aria-label={`Localização física do exemplar ${index + 1}`}
                      value={copy.physicalLocation ?? ''}
                      readOnly={copy.status === 'ON_LOAN'}
                      onChange={(event) =>
                        setCopies((current) =>
                          current.map((item) =>
                            item.id === copy.id
                              ? {
                                  ...item,
                                  physicalLocation: event.target.value,
                                }
                              : item,
                          ),
                        )
                      }
                      className="rounded-lg border border-line p-2"
                    />
                  </label>
                  {copy.id < 0 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`Remover exemplar ${index + 1}`}
                      onClick={() =>
                        setCopies((current) =>
                          current.filter(({ id }) => id !== copy.id),
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label="Excluir exemplar"
                      disabled={isDeletingCopy || copy.status === 'ON_LOAN'}
                      title={
                        copy.status === 'ON_LOAN'
                          ? 'Exemplares com empréstimo ativo não podem ser excluídos.'
                          : 'Excluir exemplar'
                      }
                      onClick={() => {
                        if (copy.status === 'ON_LOAN') return;
                        setCopyToDelete(copy);
                        setDeleteError(null);
                        setBlockedAccessionNumbers([]);
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                  {copy.status === 'ON_LOAN' && (
                    <Badge variant="neutral">Emprestado</Badge>
                  )}
                </div>
              ))}
            </section>
          )}

          {copyToDelete && (
            <div className="flex flex-col gap-3 rounded-lg border border-danger/30 bg-danger-bg p-4">
              <p className="type-small text-fg">
                Confirma a exclusão do exemplar{' '}
                <strong className="font-mono">
                  {copyToDelete.accessionNumber}
                </strong>
                ? Esta ação não pode ser desfeita.
              </p>
              {deleteError && (
                <div className="type-small text-danger" role="alert">
                  <p>{deleteError}</p>
                  {blockedAccessionNumbers.length > 0 && (
                    <p className="mt-1">
                      Tombos bloqueados: {blockedAccessionNumbers.join(', ')}
                    </p>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCopyToDelete(null)}
                  disabled={isDeletingCopy}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleDeleteCopy()}
                  disabled={isDeletingCopy}
                >
                  {isDeletingCopy ? 'Excluindo...' : 'Confirmar exclusão'}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
