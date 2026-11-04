import { Logo } from '../../shared/components/branding/Logo.tsx';
import { GithubIcon } from '../../shared/components/ui/GithubIcon.tsx';

export interface FooterProps {
  githubUrl?: string;
}

export function Footer({ githubUrl = 'https://github.com' }: FooterProps) {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="mx-auto flex w-full flex-wrap items-center justify-center sm:justify-between gap-6 px-6 py-8 sm:px-10">
        <div className="flex flex-col items-center sm:items-start gap-1">
          <Logo heightClassName="h-20" />
          <p className="type-caption text-muted text-center sm:text-left">
            Gerenciamento Inteligente de Bibliotecas
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5">
          <p className="type-small text-muted">
            Projeto acadêmico | Fatec Cotia
          </p>
          <span aria-hidden="true" className="h-8 w-px bg-line" />
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="type-label inline-flex items-center gap-2 rounded-lg text-fg hover:text-primary"
          >
            <GithubIcon size={20} />
            Ver no Github
          </a>
        </div>

      </div>
    </footer>
  );
}