import { Link } from 'react-router-dom';
import { PageHeader } from '../../shared/components/ui/PageHeader';

export function InstitutionalPage() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-16 sm:px-8 sm:py-24">
      <PageHeader
        title="Bem-vindo ao Libee"
        subtitle="Gerenciamento inteligente de bibliotecas acadêmicas."
      />
      <p className="type-body max-w-2xl text-muted">
        Consulte o acervo da biblioteca e acompanhe seus empréstimos em um só
        lugar.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          to="/entrar"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
        >
          Entrar
        </Link>
        <Link
          to="/cadastro"
          className="inline-flex h-12 items-center justify-center rounded-xl border border-line px-6 text-sm font-semibold text-fg transition-colors hover:bg-surface-hover"
        >
          Cadastrar-se
        </Link>
      </div>
    </section>
  );
}