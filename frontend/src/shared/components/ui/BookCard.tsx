import { useState } from 'react';
import { Badge } from '../ui/Badge';
import { BookmarkAvailable } from '../ui/BookmarkAvailable';
import { BorrowedBookmark } from '../ui/BarrowedBookmark';

export interface BookCardProps {
  title: string;
  author: string;
  year: number | string;
  pages: number | string;
  category: string;
  status: 'available' | 'borrowed';
  coverUrl?: string | null;
  className?: string;
}

export function BookCard({
  title,
  author,
  year,
  pages,
  category,
  status,
  coverUrl,
  className,
}: BookCardProps) {
  const [imageError, setImageError] = useState(false);
  const isAvailable = status === 'available';

  return (
    <div
      className={`relative flex flex-col w-72 rounded-xl bg-gray-200 p-4 shadow-md ${
        className ?? ''
      }`}
    >

     <div className="absolute top-0 right-0 z-10">
        {isAvailable ? <BookmarkAvailable /> : <BorrowedBookmark />}
    </div>

      {/* Capa do Livro */}
      <div className="w-full h-64 bg-gray-300 rounded-lg mb-4 overflow-hidden flex items-center justify-center relative">
        {coverUrl && !imageError ? (
          <img
            src={coverUrl}
            alt={`Capa do livro ${title}`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 p-4 text-center">
            <svg
              className="w-12 h-12 mb-2 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="text-xs font-medium">Sem Capa</span>
          </div>
        )}
      </div>

      {/* Detalhes do Livro */}
      <div className="flex justify-between items-start mb-1">
        <h3
          className="text-lg font-semibold text-gray-800 truncate max-w-[160px]"
          title={title}
        >
          {title}
        </h3>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {pages} Páginas
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        {author}, {year}
      </p>

      {/* Badges / Tags do Rodapé */}
      <div className="flex items-center gap-2 mt-auto">
        <Badge
          variant="neutral"
          className="bg-amber-100 border-amber-200 text-amber-900"
        >
          {category}
        </Badge>

        {isAvailable ? (
          <Badge variant="success" dot>
            Disponível
          </Badge>
        ) : (
          <Badge
            variant="info"
            dot
            className="border-blue-300 bg-blue-50 text-blue-600"
          >
            Emprestado
          </Badge>
        )}
      </div>
    </div>
  );
}