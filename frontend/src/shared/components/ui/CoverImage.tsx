import { useState, type ImgHTMLAttributes } from 'react';
import { cn } from './cn';

export type BookCoverSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface CoverImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'alt'
> {
  src?: string | null;
  alt: string;
  size?: BookCoverSize;
  fallbackSrc?: string;
}

const SIZE_CLASSES: Record<BookCoverSize, string> = {
  // 40px × 60px
  xs: 'h-15 w-10',
  // 80px × 120px
  sm: 'h-30 w-20',
  // 160px × 240px
  md: 'h-60 w-40',
  // 240px × 360px
  lg: 'h-90 w-60',
  // 400px × 600px
  xl: 'h-150 w-100',
};

const DEFAULT_FALLBACK_SRC = '/images/book-cover-placeholder.svg';

export function CoverImage({
  src,
  alt,
  size,
  fallbackSrc = DEFAULT_FALLBACK_SRC,
  className,
  loading = 'lazy',
  onError,
  ...rest
}: CoverImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const source = src && failedSrc !== src ? src : fallbackSrc;

  return (
    <img
      {...rest}
      src={source}
      alt={alt}
      loading={loading}
      className={cn(
        'block object-cover',
        size ? SIZE_CLASSES[size] : undefined,
        className,
      )}
      onError={(event) => {
        onError?.(event);
        if (source !== fallbackSrc) setFailedSrc(source);
      }}
    />
  );
}
