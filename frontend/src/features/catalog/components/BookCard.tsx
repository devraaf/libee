import { Link } from 'react-router-dom';
import { Card } from '@/shared/components/ui/Card';
import { CoverImage } from '@/shared/components/ui/CoverImage';
import type { BookListItem } from '@/shared/types/library';
import { BookmarkAvailable } from '@/shared/components/ui/BookmarkAvailable';

export interface BookCardProps {
  book: BookListItem;
}

export function BookCard({ book }: BookCardProps) {
  const authors = book.authors.map(({ name }) => name).join(', ');

  return (
    <Link
      to={`/livros/${book.id}`}
      className="group block h-full rounded-xl focus-visible:outline"
      aria-label={`Ver detalhes de ${book.title}`}
    >
      <Card
        as="article"
        className="relative flex h-full flex-col overflow-hidden p-2 transition-shadow group-hover:shadow-card"
      >
        {book.available && (
          <BookmarkAvailable
            width={20}
            height={32}
            role="img"
            aria-label="Disponível para empréstimo"
            className="absolute right-2 top-1 z-10"
          />
        )}
        <div className="aspect-3/4 overflow-hidden rounded-lg bg-surface-warm">
          <CoverImage
            src={book.coverImageUrl}
            alt={`Capa do livro ${book.title}`}
            className="h-full w-full"
          />
        </div>
        <div className="flex flex-1 flex-col pt-2">
          <h2 className="type-small line-clamp-1 font-semibold text-fg">
            {book.title}
          </h2>
          <p className="type-caption mt-1 line-clamp-1 text-muted">
            {authors || 'Autor não informado'}
          </p>
          <span className="type-caption mt-2 w-fit rounded-full bg-chip px-3 py-1 text-muted">
            {book.category.name}
          </span>
        </div>
      </Card>
    </Link>
  );
}
