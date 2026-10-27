import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { mockBooks, mockCopies, mockReaders } from '../../../../shared/mocks/data';
import { registerLoanSchema, type RegisterLoanFormData } from '../schemas/loan.schema';

interface RegisterLoanFormProps {
  onCancel: () => void;
  onConfirm: (data: RegisterLoanFormData) => Promise<void>;
}

export default function RegisterLoanForm({ onCancel, onConfirm }: RegisterLoanFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Data de devolução prevista padrão: Hoje + 7 dias
  const getDefaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterLoanFormData>({
    resolver: zodResolver(registerLoanSchema) as any,
    defaultValues: {
      readerId: '',
      readerName: '',
      copyCode: '',
      dueDate: getDefaultDueDate(),
    },
  });

  const readerInput = watch('readerName') || '';
  
  const [selectedReader, setSelectedReader] = useState<{ id: string; name: string; email: string } | null>(null);
  const [isSearchingReader, setIsSearchingReader] = useState(false);
  const [readerNotFound, setReaderNotFound] = useState(false);

  const [bookDetails, setBookDetails] = useState<{ title: string; available: boolean } | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);


  const handleSearchReader = () => {
    if (!readerInput.trim()) return;
    setIsSearchingReader(true);
    setReaderNotFound(false);

    setTimeout(() => {
      const savedReaders = localStorage.getItem('readersList');
      const allReaders = savedReaders ? JSON.parse(savedReaders) : mockReaders;

      const found = allReaders.find(
        (r: any) =>
          r.name.toLowerCase().includes(readerInput.toLowerCase()) ||
          r.email.toLowerCase().includes(readerInput.toLowerCase())
      );

      if (found) {
        setSelectedReader({ id: String(found.id), name: found.name, email: found.email });
        setValue('readerId', String(found.id));
        setValue('readerName', found.name);
        setReaderNotFound(false);
      } else {
        setSelectedReader(null);
        setValue('readerId', '');
        setReaderNotFound(true);
      }
      setIsSearchingReader(false);
    }, 300);
  };

  // Validação do Tombo consumindo mockCopies + mockBooks
  const handleValidateCopy = (code: string) => {
    if (!code.trim()) {
      setBookDetails(null);
      setCopyError(null);
      return;
    }

    const savedCopies = localStorage.getItem('copiesList');
    const copies = savedCopies ? JSON.parse(savedCopies) : mockCopies;

    const copy = copies.find((c: any) => c.accessionNumber === code.trim() || String(c.id) === code.trim());

    if (!copy) {
      setBookDetails(null);
      setCopyError('Exemplar inexistente no catálogo.');
      return;
    }

    if (copy.status === 'ON_LOAN') {
      setBookDetails(null);
      setCopyError('Exemplar já se encontra emprestado.');
      return;
    }

    const savedBooks = localStorage.getItem('booksList');
    const books = savedBooks ? JSON.parse(savedBooks) : mockBooks;
    const book = books.find((b: any) => b.id === copy.bookId);

    setCopyError(null);
    setBookDetails({
      title: book ? book.title : `Exemplar nº ${copy.accessionNumber}`,
      available: true,
    });
  };

  const handleFormSubmit = async (data: RegisterLoanFormData) => {
    if (copyError || !bookDetails?.available) return;
    setIsLoading(true);
    try {
      await onConfirm(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
      {/* Campo Leitor */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">
          Leitor (nome ou e-mail)
        </label>
        <div className="flex gap-2">
          <input
            {...register('readerName')}
            type="text"
            placeholder="Digite o nome ou e-mail do leitor"
            className="w-full rounded-lg border border-[#E7DCC4] bg-white px-3 py-2 text-sm text-[#3B2A1A] focus:outline-none focus:border-[#9A5B00]"
          />
          <button
            type="button"
            onClick={handleSearchReader}
            disabled={isSearchingReader}
            className="rounded-lg border border-[#9A5B00] px-4 py-2 text-sm font-medium text-[#9A5B00] hover:bg-[#F9F0DC] flex items-center gap-1"
          >
            {isSearchingReader ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Buscar
          </button>
        </div>
        {errors.readerName && (
          <span className="mt-1 block text-xs text-red-600">{errors.readerName.message}</span>
        )}
      </div>

      {selectedReader && (
        <div className="rounded-lg bg-[#FDF9ED] p-3 border border-[#E7DCC4] text-xs text-[#3B2A1A] flex justify-between items-center">
          <div>
            <p className="font-semibold">{selectedReader.name}</p>
            <p className="text-[#6B5A45]">{selectedReader.email}</p>
          </div>
          <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded text-[10px]">
            Leitor Selecionado
          </span>
        </div>
      )}

      {readerNotFound && (
        <div className="rounded-lg bg-red-50 p-3 border border-red-200 text-xs text-red-800 flex justify-between items-center">
          <span>Leitor não encontrado no sistema.</span>
          <button
            type="button"
            onClick={() => {
              const newReader = {
                id: Date.now(),
                name: readerInput,
                email: 'novo.leitor@example.com',
                affiliationType: 'STUDENT',
                profile: 'READER',
              };
              const saved = localStorage.getItem('readersList');
              const list = saved ? JSON.parse(saved) : mockReaders;
              localStorage.setItem('readersList', JSON.stringify([newReader, ...list]));

              setSelectedReader({ id: String(newReader.id), name: newReader.name, email: newReader.email });
              setValue('readerId', String(newReader.id));
              setValue('readerName', newReader.name);
              setReaderNotFound(false);
            }}
            className="text-xs font-semibold text-white bg-[#F97316] px-2.5 py-1.5 rounded hover:bg-[#EA580C] flex items-center gap-1"
          >
            <UserPlus size={12} />
            Cadastrar leitor
          </button>
        </div>
      )}

      {/* Campo Tombo do Exemplar */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">
          Tombo do exemplar (ex: 0001, 0002)
        </label>
        <input
          {...register('copyCode')}
          type="text"
          placeholder="Digite o código do tombo"
          onChange={(e) => {
            register('copyCode').onChange(e);
            handleValidateCopy(e.target.value);
          }}
          className="w-full rounded-lg border border-[#E7DCC4] bg-white px-3 py-2 text-sm text-[#3B2A1A] focus:outline-none focus:border-[#9A5B00]"
        />
        {copyError && <span className="mt-1 block text-xs text-red-600">{copyError}</span>}
        {errors.copyCode && <span className="mt-1 block text-xs text-red-600">{errors.copyCode.message}</span>}
      </div>

      {bookDetails && (
        <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200 text-xs text-emerald-900">
          <p className="font-semibold">Título do Livro: {bookDetails.title}</p>
          <p className="text-emerald-700">Exemplar disponível para empréstimo.</p>
        </div>
      )}

      {/* Campo Devolução Prevista */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-[#3B2A1A]">
          Devolução prevista
        </label>
        <input
          {...register('dueDate')}
          type="date"
          min={todayStr}
          className="w-full rounded-lg border border-[#E7DCC4] bg-white px-3 py-2 text-sm text-[#3B2A1A] focus:outline-none focus:border-[#9A5B00]"
        />
        {errors.dueDate && <span className="mt-1 block text-xs text-red-600">{errors.dueDate.message}</span>}
      </div>

      <p className="text-[11px] text-[#6B5A45]">Registrado por Bibliotecário</p>

      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-lg border border-[#6B5A45] bg-white px-4 py-2 text-sm font-medium text-[#3B2A1A] hover:bg-[#F9F0DC]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading || !!copyError || !bookDetails}
          className="rounded-lg bg-[#F97316] px-4 py-2 text-sm font-medium text-white hover:bg-[#EA580C] flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading && <Loader2 size={16} className="animate-spin" />}
          Confirmar
        </button>
      </div>
    </form>
  );
}