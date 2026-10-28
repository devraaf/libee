import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, X } from 'lucide-react';
import { mockBooks, mockCategories, mockCopies } from '../../../../shared/mocks/data';
import { Modal } from '../../../../shared/components/ui/Modal';
import { registerBookSchema, type RegisterBookFormData } from '../schemas/book.schema';

interface EditBookModalProps {
  open: boolean;
  bookId: number | null;
  onClose: () => void;
  onSuccess: (updatedTitle: string) => void;
}

export default function EditBookModal({
  open,
  bookId,
  onClose,
  onSuccess,
}: EditBookModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [authorInput, setAuthorInput] = useState('');
  const [authorError, setAuthorError] = useState('');
  const [copyStatuses, setCopyStatuses] = useState<Record<number, string>>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    setError,
    clearErrors,
    trigger,
    formState: { errors },
  } = useForm<RegisterBookFormData>({
    resolver: zodResolver(registerBookSchema) as any,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'copies',
  });

  const authorsList = watch('authors') || [];

  // Carrega os dados do livro e dos exemplares ao abrir o modal
  useEffect(() => {
    if (!open || !bookId) return;

    const savedBooks = localStorage.getItem('booksList');
    const booksList = savedBooks ? JSON.parse(savedBooks) : mockBooks;
    const bookToEdit = booksList.find((b: any) => b.id === bookId);

    const savedCopies = localStorage.getItem('copiesList');
    const copiesList = savedCopies ? JSON.parse(savedCopies) : mockCopies;
    const bookCopies = copiesList.filter((c: any) => c.bookId === bookId);

    if (bookToEdit) {
      const formattedAuthors = Array.isArray(bookToEdit.authors)
        ? bookToEdit.authors.map((a: any) => (typeof a === 'string' ? a : a.name))
        : [];

      reset({
        isbn: bookToEdit.isbn,
        title: bookToEdit.title,
        authors: formattedAuthors,
        categoryId: bookToEdit.category?.id || 1,
        publisher: bookToEdit.publisher || '',
        publicationPlace: bookToEdit.publicationPlace || '',
        edition: bookToEdit.edition || '1ª',
        publicationDate: bookToEdit.publicationDate || '',
        pageCount: bookToEdit.pageCount || 0,
        coverImageUrl: bookToEdit.coverImageUrl || '',
        summary: bookToEdit.summary || '',
        copies: bookCopies.length > 0
          ? bookCopies.map((c: any) => ({
              accessionNumber: c.accessionNumber,
              physicalLocation: c.physicalLocation,
            }))
          : [{ accessionNumber: '', physicalLocation: '' }],
      });

      // Mapeia o status dos exemplares
      const statuses: Record<number, string> = {};
      bookCopies.forEach((c: any, index: number) => {
        statuses[index] = c.status;
      });
      setCopyStatuses(statuses);
    }
  }, [open, bookId, reset]);

  const handleDateMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 4) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    } else if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setValue('publicationDate', value, { shouldValidate: true });
  };

  const handleNextFromStep1 = async () => {
    const isValid = await trigger([
      'title',
      'authors',
      'categoryId',
      'publisher',
      'publicationPlace',
      'edition',
      'publicationDate',
      'pageCount',
    ]);
    if (isValid) {
      setCurrentStep(2);
    }
  };

  const handleAddAuthor = () => {
    if (!authorInput.trim()) {
      setAuthorError('Digite o nome do autor antes de adicionar.');
      return;
    }
    if (authorsList.includes(authorInput.trim())) {
      setAuthorError('Este autor já foi adicionado.');
      return;
    }
    setValue('authors', [...authorsList, authorInput.trim()], { shouldValidate: true });
    setAuthorInput('');
    setAuthorError('');
    clearErrors('authors');
  };

  const handleRemoveAuthor = (indexToRemove: number) => {
    const updated = authorsList.filter((_, idx) => idx !== indexToRemove);
    setValue('authors', updated, { shouldValidate: true });
  };

  const onSubmit = (data: RegisterBookFormData) => {
    if (!bookId) return;

    const savedCopies = localStorage.getItem('copiesList');
    const existingCopies = savedCopies ? JSON.parse(savedCopies) : mockCopies;

    // Validação de tombos duplicados em relação a OUTROS livros do acervo
    let hasAccessionError = false;
    data.copies.forEach((c, idx) => {
      const isDuplicateInOtherBook = existingCopies.some(
        (ec: any) => ec.bookId !== bookId && ec.accessionNumber.trim() === c.accessionNumber.trim()
      );
      if (isDuplicateInOtherBook) {
        setError(`copies.${idx}.accessionNumber` as any, {
          type: 'manual',
          message: 'Tombo já cadastrado em outro livro do acervo.',
        });
        hasAccessionError = true;
      }
    });

    if (hasAccessionError) return;

    // Atualiza Livro no LocalStorage
    const savedBooks = localStorage.getItem('booksList');
    const booksList = savedBooks ? JSON.parse(savedBooks) : mockBooks;
    const selectedCategory = mockCategories.find((cat) => cat.id === data.categoryId);

    const updatedBooks = booksList.map((b: any) => {
      if (b.id === bookId) {
        return {
          ...b,
          isbn: data.isbn,
          title: data.title,
          publisher: data.publisher,
          publicationPlace: data.publicationPlace,
          edition: data.edition,
          coverImageUrl: data.coverImageUrl || null,
          publicationDate: data.publicationDate,
          pageCount: data.pageCount,
          summary: data.summary || '',
          category: selectedCategory || mockCategories[0],
          authors: data.authors.map((name, i) => ({ id: i + 1, name })),
        };
      }
      return b;
    });

    localStorage.setItem('booksList', JSON.stringify(updatedBooks));

    // Atualiza Exemplares no LocalStorage
    const otherCopies = existingCopies.filter((c: any) => c.bookId !== bookId);
    const updatedBookCopies = data.copies.map((c, i) => ({
      id: bookId + i + 100,
      bookId: bookId,
      accessionNumber: c.accessionNumber.trim(),
      physicalLocation: c.physicalLocation.trim(),
      status: copyStatuses[i] || 'AVAILABLE',
    }));

    localStorage.setItem('copiesList', JSON.stringify([...otherCopies, ...updatedBookCopies]));

    onSuccess(data.title);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="">
      <div className="flex flex-col max-h-[85vh] -m-6">
     <div className="px-6 pt-6 pb-4 border-b border-[#E7DCC4]">
  <h2 className="text-xl font-bold text-[#3B2A1A]">Editar livro</h2>
</div>

        {/* Stepper Simplificado de Edição */}
        <div className="flex items-center gap-6 px-6 py-4 bg-[#FAF7F2] border-b border-[#E7DCC4] text-xs font-semibold">
          <div className={`flex items-center gap-2 ${currentStep === 1 ? 'text-[#9A5B00]' : 'text-[#8C7A6B]'}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full ${currentStep === 1 ? 'bg-[#9A5B00] text-white' : 'bg-[#E7DCC4] text-[#3B2A1A]'}`}>
              1
            </span>
            Dados do livro
          </div>
          <div className={`flex items-center gap-2 ${currentStep === 2 ? 'text-[#9A5B00]' : 'text-[#8C7A6B]'}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full ${currentStep === 2 ? 'bg-[#9A5B00] text-white' : 'bg-[#E7DCC4] text-[#3B2A1A]'}`}>
              2
            </span>
            Exemplares
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit(onSubmit)} id="edit-book-form">
            {currentStep === 1 && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">ISBN</label>
                  <input
                    {...register('isbn')}
                    type="text"
                    readOnly
                    className="w-full rounded-lg border border-[#E7DCC4] bg-[#FDF9ED] px-3 py-2 text-sm text-[#3B2A1A]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">Título *</label>
                  <input
                    {...register('title')}
                    type="text"
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#3B2A1A] focus:outline-none ${
                      errors.title ? 'border-red-500 bg-red-50' : 'border-[#E7DCC4] focus:border-[#9A5B00]'
                    }`}
                  />
                  {errors.title && <span className="mt-1 block text-xs text-red-600">{errors.title.message}</span>}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">Autores *</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {authorsList.map((author, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 rounded-md bg-[#F4EBD9] px-2.5 py-1 text-xs font-medium text-[#3B2A1A]"
                      >
                        {author}
                        <button type="button" onClick={() => handleRemoveAuthor(index)} className="hover:text-red-600">
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={authorInput}
                      onChange={(e) => setAuthorInput(e.target.value)}
                      placeholder="Nome do autor"
                      className="w-full rounded-lg border border-[#E7DCC4] bg-white px-3 py-2 text-sm text-[#3B2A1A]"
                    />
                    <button
                      type="button"
                      onClick={handleAddAuthor}
                      className="rounded-lg border border-[#9A5B00] px-4 py-2 text-sm font-medium text-[#9A5B00] hover:bg-[#F9F0DC]"
                    >
                      Adicionar
                    </button>
                  </div>
                  {authorError && <span className="mt-1 block text-xs text-red-600">{authorError}</span>}
                  {errors.authors && <span className="mt-1 block text-xs text-red-600">{errors.authors.message}</span>}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">Categoria *</label>
                  <select
                    {...register('categoryId', { valueAsNumber: true })}
                    className="w-full rounded-lg border border-[#E7DCC4] bg-white px-3 py-2 text-sm text-[#3B2A1A]"
                  >
                    {mockCategories.map((cat: { id: number; name: string }) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">Editora *</label>
                    <input
                      {...register('publisher')}
                      type="text"
                      className="w-full rounded-lg border border-[#E7DCC4] bg-white px-3 py-2 text-sm text-[#3B2A1A]"
                    />
                    {errors.publisher && <span className="mt-1 block text-xs text-red-600">{errors.publisher.message}</span>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">Local *</label>
                    <input
                      {...register('publicationPlace')}
                      type="text"
                      className="w-full rounded-lg border border-[#E7DCC4] bg-white px-3 py-2 text-sm text-[#3B2A1A]"
                    />
                    {errors.publicationPlace && <span className="mt-1 block text-xs text-red-600">{errors.publicationPlace.message}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">Edição *</label>
                    <input
                      {...register('edition')}
                      type="text"
                      className="w-full rounded-lg border border-[#E7DCC4] bg-white px-3 py-2 text-sm text-[#3B2A1A]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">Publicação *</label>
                    <input
                      {...register('publicationDate')}
                      type="text"
                      maxLength={10}
                      onChange={handleDateMask}
                      placeholder="DD/MM/AAAA"
                      className="w-full rounded-lg border border-[#E7DCC4] bg-white px-3 py-2 text-sm text-[#3B2A1A]"
                    />
                    {errors.publicationDate && <span className="mt-1 block text-xs text-red-600">{errors.publicationDate.message}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">Páginas *</label>
                    <input
                      {...register('pageCount')}
                      type="number"
                      className="w-full rounded-lg border border-[#E7DCC4] bg-white px-3 py-2 text-sm text-[#3B2A1A]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">URL da capa (Opcional)</label>
                    <input
                      {...register('coverImageUrl')}
                      type="text"
                      className="w-full rounded-lg border border-[#E7DCC4] bg-white px-3 py-2 text-sm text-[#3B2A1A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">Resumo (Opcional)</label>
                  <textarea
                    {...register('summary')}
                    rows={3}
                    className="w-full rounded-lg border border-[#E7DCC4] bg-white px-3 py-2 text-sm text-[#3B2A1A]"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-[#3B2A1A]">Exemplares da obra</h3>
                  <button
                    type="button"
                    onClick={() => append({ accessionNumber: '', physicalLocation: '' })}
                    className="text-xs font-semibold text-[#9A5B00] hover:text-[#7A4800] flex items-center gap-1"
                  >
                    <Plus size={14} /> Adicionar exemplar
                  </button>
                </div>

                {fields.map((field, index) => {
                  const isOnLoan = copyStatuses[index] === 'ON_LOAN';

                  return (
                    <div
                      key={field.id}
                      className="p-3 rounded-lg border border-[#E7DCC4] bg-[#FDF9ED] flex flex-col gap-3 relative"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#3B2A1A]">Exemplar {index + 1}</span>
                          {isOnLoan && (
                            <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-medium">
                              Emprestado
                            </span>
                          )}
                        </div>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            disabled={isOnLoan}
                            onClick={() => remove(index)}
                            title={isOnLoan ? 'Exemplares emprestados não podem ser removidos.' : 'Remover exemplar'}
                            className={`flex items-center gap-1 text-xs ${
                              isOnLoan
                                ? 'text-gray-400 cursor-not-allowed opacity-50'
                                : 'text-red-500 hover:text-red-700'
                            }`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">
                            Tombo (Nº de Registro) *
                          </label>
                          <input
                            {...register(`copies.${index}.accessionNumber`)}
                            type="text"
                            className="w-full rounded-lg border border-[#E7DCC4] bg-white px-3 py-2 text-sm text-[#3B2A1A]"
                          />
                          {errors.copies?.[index]?.accessionNumber && (
                            <span className="mt-1 block text-xs text-red-600">
                              {errors.copies[index]?.accessionNumber?.message}
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">
                            Localização Física *
                          </label>
                          <input
                            {...register(`copies.${index}.physicalLocation`)}
                            type="text"
                            className="w-full rounded-lg border border-[#E7DCC4] bg-white px-3 py-2 text-sm text-[#3B2A1A]"
                          />
                          {errors.copies?.[index]?.physicalLocation && (
                            <span className="mt-1 block text-xs text-red-600">
                              {errors.copies[index]?.physicalLocation?.message}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </form>
        </div>

        <div className="flex justify-between items-center px-6 py-4 border-t border-[#E7DCC4] bg-white">
          <button
            type="button"
            onClick={() => {
              if (currentStep === 2) setCurrentStep(1);
              else onClose();
            }}
            className="rounded-lg border border-[#6B5A45] bg-white px-4 py-2 text-sm font-medium text-[#3B2A1A]"
          >
            {currentStep === 1 ? 'Cancelar' : 'Voltar'}
          </button>

          {currentStep === 1 ? (
            <button
              type="button"
              onClick={handleNextFromStep1}
              className="rounded-lg bg-[#F97316] px-5 py-2 text-sm font-medium text-white hover:bg-[#EA580C]"
            >
              Continuar
            </button>
          ) : (
            <button
              type="submit"
              form="edit-book-form"
              className="rounded-lg bg-[#F97316] px-5 py-2 text-sm font-medium text-white hover:bg-[#EA580C]"
            >
              Salvar alterações
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}