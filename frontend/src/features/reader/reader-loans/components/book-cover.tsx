import { BookOpen } from 'lucide-react';

interface BookCoverProps {
  src: string | null;
  title: string;
}

export default function BookCover({ src, title }: BookCoverProps) {
  return (
    <div className="h-[116px] w-[76px] shrink-0 overflow-hidden rounded-md bg-surface-warm flex items-center justify-center border border-line/40">
      {src ? (
        <img src={src} alt={`Capa de ${title}`} className="h-full w-full object-cover" />
      ) : (
        <BookOpen className="h-6 w-6 text-muted/60" aria-hidden="true" />
      )}
    </div>
  );
}