import { cn } from '../ui/cn'

export interface LogoProps {
  /** "full" = logotipo com texto; "mark" = apenas a abelha. */
  variant?: 'full' | 'mark'
  /** Altura da imagem (classe Tailwind). A largura segue a proporção original. */
  heightClassName?: string
  className?: string
}

const sources = {
    full: { src: '/images/logo-libee.svg', width: 700, height: 363 },
    mark: { src: '/images/logo-libee-mark.svg', width: 264, height: 400 },
}

/** Logo original do Libee. No tema escuro, o contorno escuro é invertido para manter o contraste. */
export function Logo({ variant = 'full', heightClassName = 'h-10', className }: LogoProps) {
  const { src, width, height } = sources[variant]

  return (
    <img
      src={src}
      width={width}
      height={height}
      alt="Libee"
      draggable={false}
      className={cn(
        'w-auto select-none [[data-theme=dark]_&]:[filter:invert(1)_hue-rotate(180deg)]',
        heightClassName,
        className,
      )}
    />
  )
}
