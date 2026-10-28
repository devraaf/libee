import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { BookListItem, Copy } from '@/shared/types/library';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { CoverImage } from '@/shared/components/ui/CoverImage';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Table, type TableColumn } from '@/shared/components/ui/Table';
import InfoItem from './InfoItem';

export interface BookDetailsProps {
  book: BookListItem;
  copies: Copy[];
}

const copyColumns: TableColumn<Copy>[] = [
  {
    key: 'accessionNumber',
    header: 'Tombo',
    align: 'left',
    render: (copy) => copy.accessionNumber,
  },
  {
    key: 'physicalLocation',
    header: 'Localização',
    align: 'left',
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

function formatPublicationDate(date: string | null): string {
  if (!date) return 'Não informada';
  const parsedDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return date;
  return new Intl.DateTimeFormat('pt-BR').format(parsedDate);
}

export default function BookDetails({ book, copies }: BookDetailsProps) {
  return (
    <article className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-8 sm:py-8">
      <Link
        to="/acervo"
        className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-fg hover:bg-surface-hover sm:px-4"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar para o acervo
      </Link>

      <Card
        as="section"
        aria-labelledby="book-title"
        className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:flex-row lg:p-8"
      >
        <div className="mx-auto aspect-2/3 w-40 shrink-0 overflow-hidden rounded-xl sm:w-48 lg:mx-0">
          <CoverImage
            src={book.coverImageUrl}
            alt={`Capa de ${book.title}`}
            className="h-full w-full"
          />
        </div>
        <div className="min-w-0 flex-1">
          <header>
            <h1
              id="book-title"
              className="type-h1 wrap-break-word text-2xl text-fg sm:text-3xl"
            >
              {book.title}
            </h1>
            <p className="type-body mt-2 wrap-break-word text-muted">
              {book.authors.map(({ name }) => name).join(', ') ||
                'Autor não informado'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="neutral">{book.category.name}</Badge>
              <Badge variant={book.available ? 'success' : 'info'} dot>
                {book.available
                  ? 'Disponível para empréstimo'
                  : 'Indisponível no momento'}
              </Badge>
            </div>
          </header>

          <dl className="mt-6 grid grid-cols-1 gap-x-4 gap-y-4 min-[400px]:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="ISBN" value={book.isbn} />
            <InfoItem
              label="Editora"
              value={book.publisher || 'Não informada'}
            />
            <InfoItem label="Edição" value={book.edition || 'Não informada'} />
            <InfoItem
              label="Publicação"
              value={formatPublicationDate(book.publicationDate)}
            />
            <InfoItem
              label="Local de publicação"
              value={book.publicationPlace || 'Não informado'}
            />
            <InfoItem
              label="Páginas"
              value={book.pageCount ? String(book.pageCount) : 'Não informado'}
            />
          </dl>
        </div>
      </Card>

      <Card
        as="section"
        aria-labelledby="book-summary-title"
        className="p-4 sm:p-6 lg:p-8"
      >
        <h2 id="book-summary-title" className="type-h3 text-fg">
          Resumo
        </h2>
        {book.summary ? (
          <p className="type-body mt-3 whitespace-pre-line text-muted">
            {book.summary}
          </p>
        ) : (
          <p className="type-small mt-3 text-muted">
            Não há resumo disponível para este livro.
          </p>
        )}
      </Card>

      <section className="min-w-0" aria-labelledby="copies-title">
        <div className="mb-3 flex flex-col gap-1 min-[400px]:flex-row min-[400px]:items-baseline min-[400px]:justify-between min-[400px]:gap-2">
          <h2 id="copies-title" className="type-h3 text-fg">
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
            tableClassName="min-w-[34rem]"
          />
        ) : (
          <Card>
            <EmptyState
              title="Nenhum exemplar cadastrado"
              description="Ainda não há exemplares registrados para este livro."
            />
          </Card>
        )}
      </section>
    </article>
  );
}
