import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { mockBooks, mockCategories, mockCopies } from '../../../../shared/mocks/data';
import { Modal } from '../../../../shared/components/ui/Modal';
import { registerBookSchema, type RegisterBookFormData } from '../schemas/book.schema';

interface RegisterBookModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newBook: any) => void;
  onOpenEditModal?: (bookId: number) => void;
}

export default function RegisterBookModal({
  open,
  onClose,
  onSuccess,
}: RegisterBookModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [authorInput, setAuthorInput] = useState('');
  const [authorError, setAuthorError] = useState('');
  const [isSearchingIsbn, setIsSearchingIsbn] = useState(false);
  const [isbnNotice, setIsbnNotice] = useState<{
    type: 'warning' | 'error' | 'existing';
    message: string;
    existingId?: number;
  } | null>(null);

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
    defaultValues: {
      isbn: '',
      title: '',
      authors: [],
      categoryId: 0,
      publisher: '',
      publicationPlace: '',
      edition: '1ª',
      publicationDate: '',
      pageCount: undefined,
      coverImageUrl: '',
      summary: '',
      copies: [{ accessionNumber: '', physicalLocation: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'copies',
  });

  const authorsList = watch('authors') || [];
  const isbnValue = watch('isbn') || '';

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

  const handleResetModal = () => {
    reset();
    setCurrentStep(1);
    setAuthorInput('');
    setAuthorError('');
    setIsbnNotice(null);
    onClose();
  };

  const handleNextFromStep1 = async () => {
    const isIsbnValid = await trigger('isbn');
    if (!isIsbnValid) return;

    setIsSearchingIsbn(true);
    setIsbnNotice(null);

    setTimeout(() => {
      const cleanedIsbn = isbnValue.replace(/[\s-]/g, '');
      const savedBooks = localStorage.getItem('booksList');
      const booksList = savedBooks ? JSON.parse(savedBooks) : mockBooks;
      const existingBook = booksList.find((b: any) => b.isbn.replace(/[\s-]/g, '') === cleanedIsbn);

      if (existingBook) {
        setIsbnNotice({
          type: 'existing',
          message: `Este ISBN já está cadastrado para a obra "${existingBook.title}".`,
          existingId: existingBook.id,
        });
        setIsSearchingIsbn(false);
        return;
      }

      if (cleanedIsbn === '9786587380964' || cleanedIsbn.endsWith('000')) {
        setValue('title', 'Estrutura de Dados e Algoritmos');
        setValue('authors', ['Helena Duarte', 'Clara Nogueira']);
        setValue('categoryId', 1);
        setValue('publisher', 'Editora Exemplo');
        setValue('publicationPlace', 'São Paulo');
        setValue('edition', '1ª edição');
        setValue('publicationDate', '15/01/2024');
        setValue('pageCount', 350);
        setValue('coverImageUrl', 'https://imagem-capa.png');
        setValue('summary', 'Obra de referência para algoritmos e programação.');
      } else {
        setIsbnNotice({
          type: 'warning',
          message: 'ISBN não localizado automaticamente. Por favor, preencha todos os dados.',
        });
      }

      setCurrentStep(2);
      setIsSearchingIsbn(false);
    }, 300);
  };

  const handleNextFromStep2 = async () => {
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
      setCurrentStep(3);
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
    const savedCopies = localStorage.getItem('copiesList');
    const existingCopies = savedCopies ? JSON.parse(savedCopies) : mockCopies;
    let hasAccessionError = false;

    data.copies.forEach((c, idx) => {
      const isAlreadySaved = existingCopies.some(
        (ec: any) => ec.accessionNumber.trim() === c.accessionNumber.trim()
      );
      if (isAlreadySaved) {
        setError(`copies.${idx}.accessionNumber` as any, {
          type: 'manual',
          message: 'Tombo já pertence a outro exemplar.',
        });
        hasAccessionError = true;
      }
    });

    if (hasAccessionError) return;

    const newBookId = Date.now();
    const selectedCategory = mockCategories.find((cat: { id: number; name: string }) => cat.id === data.categoryId);

    const newBook = {
      id: newBookId,
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

    const savedBooks = localStorage.getItem('booksList');
    const booksList = savedBooks ? JSON.parse(savedBooks) : mockBooks;
    localStorage.setItem('booksList', JSON.stringify([newBook, ...booksList]));

    const newCopiesRecords = data.copies.map((c, i) => ({
      id: newBookId + i + 1,
      bookId: newBookId,
      accessionNumber: c.accessionNumber.trim(),
      physicalLocation: c.physicalLocation.trim(),
      status: 'AVAILABLE',
    }));

    localStorage.setItem('copiesList', JSON.stringify([...newCopiesRecords, ...existingCopies]));

    onSuccess({ ...newBook, copiesCount: newCopiesRecords.length });
    handleResetModal();
  };

  return (
    <Modal open={open} onClose={handleResetModal} title="">
      <div className="flex flex-col max-h-[85vh] -m-6">
        <div className="px-6 pt-6 pb-4 border-b border-[#E7DCC4]">
          <h2 className="text-xl font-bold text-[#3B2A1A]">Cadastrar livro</h2>
        </div>

        <div className="flex items-center gap-6 px-6 py-4 bg-[#FAF7F2] border-b border-[#E7DCC4] text-xs font-semibold">
          <div className={`flex items-center gap-2 ${currentStep === 1 ? 'text-[#9A5B00]' : 'text-[#8C7A6B]'}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full ${currentStep === 1 ? 'bg-[#9A5B00] text-white' : 'bg-[#E7DCC4] text-[#3B2A1A]'}`}>
              1
            </span>
            ISBN
          </div>
          <div className={`flex items-center gap-2 ${currentStep === 2 ? 'text-[#9A5B00]' : 'text-[#8C7A6B]'}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full ${currentStep === 2 ? 'bg-[#9A5B00] text-white' : 'bg-[#E7DCC4] text-[#3B2A1A]'}`}>
              2
            </span>
            Dados do livro
          </div>
          <div className={`flex items-center gap-2 ${currentStep === 3 ? 'text-[#9A5B00]' : 'text-[#8C7A6B]'}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full ${currentStep === 3 ? 'bg-[#9A5B00] text-white' : 'bg-[#E7DCC4] text-[#3B2A1A]'}`}>
              3
            </span>
            Exemplares
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit(onSubmit)} id="register-book-form">
            {currentStep === 1 && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">
                    ISBN (10 ou 13 dígitos) *
                  </label>
                  <input
                    {...register('isbn')}
                    type="text"
                    placeholder="ex: 9786587380964"
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#3B2A1A] focus:outline-none ${
                      errors.isbn ? 'border-red-500 bg-red-50' : 'border-[#E7DCC4] focus:border-[#9A5B00]'
                    }`}
                  />
                  {errors.isbn && (
                    <span className="mt-1.5 block text-xs font-medium text-red-600">
                      {errors.isbn.message}
                    </span>
                  )}
                </div>

                {isbnNotice && (
                  <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-xs text-amber-900 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
                      <span>{isbnNotice.message}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="flex flex-col gap-4">
                {isbnNotice && isbnNotice.type === 'warning' && (
                  <div className="rounded-lg bg-blue-50 p-3 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
                    <AlertCircle size={16} className="text-blue-600 flex-shrink-0" />
                    <span>{isbnNotice.message}</span>
                  </div>
                )}

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
                  <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">
                    Título *
                  </label>
                  <input
                    {...register('title')}
                    type="text"
                    placeholder="Título da obra"
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#3B2A1A] focus:outline-none ${
                      errors.title ? 'border-red-500 bg-red-50' : 'border-[#E7DCC4] focus:border-[#9A5B00]'
                    }`}
                  />
                  {errors.title && (
                    <span className="mt-1.5 block text-xs font-medium text-red-600">
                      {errors.title.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">
                    Autores *
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {authorsList.map((author, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 rounded-md bg-[#F4EBD9] px-2.5 py-1 text-xs font-medium text-[#3B2A1A]"
                      >
                        {author}
                        <button
                          type="button"
                          onClick={() => handleRemoveAuthor(index)}
                          className="text-[#6B5A45] hover:text-red-600"
                        >
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
                      className="w-full rounded-lg border border-[#E7DCC4] bg-white px-3 py-2 text-sm text-[#3B2A1A] focus:outline-none focus:border-[#9A5B00]"
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
                  {errors.authors && (
                    <span className="mt-1.5 block text-xs font-medium text-red-600">
                      {errors.authors.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">
                    Categoria *
                  </label>
                  <select
                    {...register('categoryId', { valueAsNumber: true })}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#3B2A1A] focus:outline-none ${
                      errors.categoryId ? 'border-red-500 bg-red-50' : 'border-[#E7DCC4] focus:border-[#9A5B00]'
                    }`}
                  >
                    <option value={0}>Selecione uma categoria...</option>
                    {mockCategories.map((cat: { id: number; name: string }) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <span className="mt-1.5 block text-xs font-medium text-red-600">
                      {errors.categoryId.message}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">Editora *</label>
                    <input
                      {...register('publisher')}
                      type="text"
                      placeholder="Editora"
                      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#3B2A1A] focus:outline-none ${
                        errors.publisher ? 'border-red-500 bg-red-50' : 'border-[#E7DCC4] focus:border-[#9A5B00]'
                      }`}
                    />
                    {errors.publisher && (
                      <span className="mt-1.5 block text-xs font-medium text-red-600">{errors.publisher.message}</span>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">Local *</label>
                    <input
                      {...register('publicationPlace')}
                      type="text"
                      placeholder="Local de publicação"
                      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#3B2A1A] focus:outline-none ${
                        errors.publicationPlace ? 'border-red-500 bg-red-50' : 'border-[#E7DCC4] focus:border-[#9A5B00]'
                      }`}
                    />
                    {errors.publicationPlace && (
                      <span className="mt-1.5 block text-xs font-medium text-red-600">{errors.publicationPlace.message}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">Edição *</label>
                    <input
                      {...register('edition')}
                      type="text"
                      placeholder="ex: 1ª"
                      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#3B2A1A] focus:outline-none ${
                        errors.edition ? 'border-red-500 bg-red-50' : 'border-[#E7DCC4] focus:border-[#9A5B00]'
                      }`}
                    />
                    {errors.edition && (
                      <span className="mt-1.5 block text-xs font-medium text-red-600">{errors.edition.message}</span>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">Publicação *</label>
                    <input
                      {...register('publicationDate')}
                      type="text"
                      maxLength={10}
                      onChange={handleDateMask}
                      placeholder="DD/MM/AAAA"
                      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#3B2A1A] focus:outline-none ${
                        errors.publicationDate ? 'border-red-500 bg-red-50' : 'border-[#E7DCC4] focus:border-[#9A5B00]'
                      }`}
                    />
                    {errors.publicationDate && (
                      <span className="mt-1.5 block text-xs font-medium text-red-600">
                        {errors.publicationDate.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">Páginas *</label>
                    <input
                      {...register('pageCount')}
                      type="number"
                      placeholder="300"
                      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#3B2A1A] focus:outline-none ${
                        errors.pageCount ? 'border-red-500 bg-red-50' : 'border-[#E7DCC4] focus:border-[#9A5B00]'
                      }`}
                    />
                    {errors.pageCount && (
                      <span className="mt-1.5 block text-xs font-medium text-red-600">{errors.pageCount.message}</span>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">URL da capa (Opcional)</label>
                    <input
                      {...register('coverImageUrl')}
                      type="text"
                      placeholder="https://imagem-capa"
                      className="w-full rounded-lg border border-[#E7DCC4] bg-white px-3 py-2 text-sm text-[#3B2A1A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">Resumo (Opcional)</label>
                  <textarea
                    {...register('summary')}
                    rows={3}
                    placeholder="Resumo da obra..."
                    className="w-full rounded-lg border border-[#E7DCC4] bg-white px-3 py-2 text-sm text-[#3B2A1A]"
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
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

                {errors.copies?.root && (
                  <span className="text-xs font-medium text-red-600 block">{errors.copies.root.message}</span>
                )}

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-3 rounded-lg border border-[#E7DCC4] bg-[#FDF9ED] flex flex-col gap-3 relative"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#3B2A1A]">Exemplar {index + 1}</span>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-500 hover:text-red-700"
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
                          placeholder="ex: 0090"
                          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#3B2A1A] focus:outline-none ${
                            errors.copies?.[index]?.accessionNumber
                              ? 'border-red-500 bg-red-50'
                              : 'border-[#E7DCC4] focus:border-[#9A5B00]'
                          }`}
                        />
                        {errors.copies?.[index]?.accessionNumber && (
                          <span className="mt-1.5 block text-xs font-medium text-red-600">
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
                          placeholder="ex: Estante A-01"
                          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#3B2A1A] focus:outline-none ${
                            errors.copies?.[index]?.physicalLocation
                              ? 'border-red-500 bg-red-50'
                              : 'border-[#E7DCC4] focus:border-[#9A5B00]'
                          }`}
                        />
                        {errors.copies?.[index]?.physicalLocation && (
                          <span className="mt-1.5 block text-xs font-medium text-red-600">
                            {errors.copies[index]?.physicalLocation?.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        <div className="flex justify-between items-center px-6 py-4 border-t border-[#E7DCC4] bg-white">
          <button
            type="button"
            onClick={() => {
              if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as any);
              else handleResetModal();
            }}
            className="rounded-lg border border-[#6B5A45] bg-white px-4 py-2 text-sm font-medium text-[#3B2A1A] hover:bg-[#F9F0DC]"
          >
            {currentStep === 1 ? 'Cancelar' : 'Voltar'}
          </button>

          {currentStep === 1 && (
            <button
              type="button"
              onClick={handleNextFromStep1}
              disabled={isSearchingIsbn}
              className="rounded-lg bg-[#F97316] px-5 py-2 text-sm font-medium text-white hover:bg-[#EA580C] flex items-center gap-2"
            >
              {isSearchingIsbn && <Loader2 size={14} className="animate-spin" />}
              Continuar
            </button>
          )}

          {currentStep === 2 && (
            <button
              type="button"
              onClick={handleNextFromStep2}
              className="rounded-lg bg-[#F97316] px-5 py-2 text-sm font-medium text-white hover:bg-[#EA580C]"
            >
              Continuar
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="submit"
              form="register-book-form"
              className="rounded-lg bg-[#F97316] px-5 py-2 text-sm font-medium text-white hover:bg-[#EA580C]"
            >
              Salvar livro
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}