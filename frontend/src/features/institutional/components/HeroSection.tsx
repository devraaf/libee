import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  BookOpenText,
  LibraryBig,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function HeroSection() {
  return (
    <section
      className="relative isolate overflow-hidden bg-bg-secondary"
      aria-labelledby="hero-title"
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <span className="orbit orbit-one" />
        <span className="orbit orbit-two" />
        <span className="dot dot-one" />
        <span className="dot dot-two" />
      </div>

      <div className="relative mx-auto grid min-h-152 w-full max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.92fr)] lg:gap-16 lg:px-10 lg:py-20">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-bg/80 px-4 py-2 shadow-sm backdrop-blur">
            <BookOpen size={16} className="text-primary" aria-hidden="true" />
            <span className="type-small font-semibold text-fg">
              Projeto Acadêmico Fatec Cotia
            </span>
          </div>

          <h1 id="hero-title" className="type-display max-w-2xl text-fg">
            Gestão de bibliotecas{' '}
            <span className="text-primary">
              simples, organizada e inteligente.
            </span>
          </h1>

          <p className="type-body mt-7 max-w-xl text-muted">
            Simplifique a gestão do seu acervo. Controle de livros, empréstimos
            e devoluções de forma prática, moderna e eficiente.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/cadastro"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-on-primary shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-lg"
            >
              Começar agora
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-line-strong bg-bg/70 px-6 font-semibold text-fg transition duration-300 hover:-translate-y-0.5 hover:bg-surface hover:shadow-sm"
            >
              Ver como funciona
              <ArrowDown size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-xl lg:justify-self-end">
          <span
            className="pointer-events-none absolute -bottom-16 -left-12 size-40 rounded-full border border-primary/10"
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-center text-center">
            <div
              className="relative mb-7 flex aspect-square w-full max-w-64 items-center justify-center"
              aria-hidden="true"
            >
              <span className="about-orbit absolute inset-3 rounded-full border border-primary/15" />
              <span className="absolute inset-10 rounded-full bg-primary/5" />
              <span className="float relative z-10 flex size-32 items-center justify-center rounded-4xl border border-line bg-surface shadow-card">
                <LibraryBig size={64} className="text-primary" />
              </span>
              <span className="float float-delay absolute right-4 top-8 flex size-12 items-center justify-center rounded-2xl border border-line bg-surface text-primary shadow-sm">
                <Sparkles size={22} />
              </span>
              <span className="float float-delay-short absolute bottom-7 left-2 flex size-11 items-center justify-center rounded-2xl border border-line bg-surface text-primary shadow-sm">
                <BookOpenText size={20} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
