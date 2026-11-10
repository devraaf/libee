import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-surface py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-bg px-4 py-1.5">
            <BookOpen size={16} className="text-primary" />
            <span className="type-small font-medium text-fg">
              Projeto Acadêmico Fatec Cotia
            </span>
          </div>
          
          
          
          <p className="type-body mb-10 max-w-2xl text-muted">
            Simplifique a gestão do seu acervo. Controle de livros, empréstimos 
            e devoluções de forma prática, moderna e eficiente.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              to="/cadastro"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-fg transition-colors hover:bg-primary/90"
            >
              Começar Agora
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/acervo"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-bg px-6 py-3 font-medium text-fg transition-colors hover:bg-surface-hover"
            >
              Explorar Acervo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}