import { cn } from '../ui/cn'

export interface LogoProps {
  /** "full" = logotipo com texto; "mark" = apenas a abelha. */
  variant?: 'full' | 'mark'
  /** Altura da imagem (classe Tailwind). A largura segue a proporção original. */
  heightClassName?: string
  className?: string
}

const sources = {
  full: {
    light: '/images/logo-libee.svg',
    dark: '/images/logo-libee-light.svg',
  },
  mark: {
    light: '/images/logo-libee-mark.svg',
    dark: '/images/logo-libee-mark-light.svg',
  },
} as const

export function Logo({ variant = 'full', heightClassName = 'h-10', className }: LogoProps) {
  const logoSet = sources[variant] ?? sources.full

  return (
    <span className={cn('inline-flex items-center', heightClassName, className)}>
      {/* Logo padrão para o tema claro (some quando o atributo data-theme for dark) */}
      <img
        src={logoSet.light}
        alt="Libee"
        draggable={false}
        className={cn(
          'h-full w-auto select-none',
          '[[data-theme=dark]_&]:hidden', // Se o tema for dark, esconde esta
        )}
      />
      {/* Logo light para o tema escuro (aparece apenas quando data-theme for dark) */}
      <img
        src={logoSet.dark}
        alt="Libee"
        draggable={false}
        className={cn(
          'h-full w-auto select-none',
          'hidden [[data-theme=dark]_&]:block', // Escondida por padrão, aparece no dark
        )}
      />
    </span>
  )
}