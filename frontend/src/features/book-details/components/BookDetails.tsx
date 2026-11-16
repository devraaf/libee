import { ArrowLeft } from 'lucide-react';
import type { BookDisplay, Copy } from '@/shared/types/library';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { CoverImage } from '@/shared/components/ui/CoverImage';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Table, type TableColumn } from '@/shared/components/ui/Table';
import InfoItem from './InfoItem';
import { Chip } from '@/shared/components/ui/Chip';
import { formatLibraryDate } from '@/shared/utils/format-date';

export interface BookDetailsProps {
  book: BookDisplay;
  copies: Copy[];
  onBack: () => void;
}

const copyColumns: TableColumn<Copy>[] = [
  {
    key: 'accessionNumber',
    header: 'Tombo',
    align: 'center',
    render: (copy) => copy.accessionNumber,
  },
  {
    key: 'physicalLocation',
    header: 'Localização',
    align: 'center',
    render: (copy) => copy.physicalLocation || 'Não informada',
  },
  {
    key: 'status',
    header: 'Status',
    align: 'center',
    render: (copy) => {
      const isAvailable = copy.status === 'AVAILABLE';
      return (
        <Badge variant={isAvailable ? 'success' : 'info'} dot>
          {isAvailable ? 'Disponível' : 'Emprestado'}
        </Badge>
      );
    },
  },
];

export default function BookDetails({
  book,
  copies,
  onBack,
}: BookDetailsProps) {
  return (
    <article className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 rounded-lg bg-bg-secondary p-3 sm:gap-5 sm:p-5 sm:my-10 lg:p-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg px-2 text-sm text-muted hover:bg-surface-hover focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar à página anterior
      </button>

      <Card
        as="section"
        aria-labelledby="book-title"
        className="flex flex-col gap-5 p-4 sm:flex-row sm:gap-6 sm:p-5 lg:gap-8 lg:p-6"
      >
        <div className="mx-auto aspect-2/3 w-36 shrink-0 overflow-hidden rounded-lg sm:mx-0 sm:w-44 lg:w-48">
          <CoverImage
            src={book.coverImageUrl}
            alt={`Capa de ${book.title}`}
            className="h-full w-full"
          />
        </div>
        <div className="min-w-0 flex-1">
          <header>
            <h1 id="book-title" className="type-h2 wrap-break-word text-fg">
              {book.title}
            </h1>
            <p className="type-body mt-1 wrap-break-word text-fg">
              {book.authors.join(', ') || 'Autor não informado'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Chip>{book.category.name}</Chip>
              <Badge variant={book.available ? 'success' : 'info'} dot>
                {book.available
                  ? 'Disponível para empréstimo'
                  : 'Indisponível no momento'}
              </Badge>
            </div>
          </header>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:mt-7 lg:gap-x-6 lg:gap-y-5">
            <InfoItem
              label="Editora"
              value={book.publisher || 'Não informada'}
            />
            <InfoItem
              label="Publicação"
              value={formatLibraryDate(
                book.publicationDate,
                undefined,
                'Não informada',
              )}
            />
            <InfoItem label="Edição" value={book.edition || 'Não informada'} />
            <InfoItem
              label="Local"
              value={book.publicationPlace || 'Não informado'}
            />
            <InfoItem
              label="Páginas"
              value={book.pageCount ? String(book.pageCount) : 'Não informado'}
            />
            <InfoItem label="ISBN" value={book.isbn || 'Não informado'} />
          </dl>
        </div>
      </Card>

      <Card
        as="section"
        aria-labelledby="book-summary-title"
        className="p-4 sm:p-5 lg:p-6"
      >
        <h2 id="book-summary-title" className="type-body font-semibold text-fg">
          Descrição
        </h2>
        {book.summary ? (
          <p className="type-small mt-2 whitespace-pre-line leading-relaxed text-fg">
            {book.summary}
          </p>
        ) : (
          <p className="type-small mt-2 text-muted">
            Não há resumo disponível para este livro.
          </p>
        )}
      </Card>

      <Card
        as="section"
        aria-labelledby="copies-title"
        className="min-w-0 p-4 sm:p-5 lg:p-6"
      >
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 id="copies-title" className="type-h3 font-semibold text-fg">
            Exemplares
          </h2>
          <p className="type-small text-muted">
            Total de exemplares: {copies.length}
          </p>
        </div>
        {copies.length > 0 ? (
          <Table
            columns={copyColumns}
            rows={copies}
            getRowKey={(copy) => copy.id}
            caption={`Exemplares de ${book.title}`}
            scrollableLabel={`Tabela de exemplares de ${book.title}. Role horizontalmente para ver todas as colunas.`}
            tableClassName="min-w-[32rem]"
          />
        ) : (
          <EmptyState
            title="Nenhum exemplar cadastrado"
            description="Ainda não há exemplares registrados para este livro."
            className="py-8"
          />
        )}
      </Card>
    </article>
  );
}
