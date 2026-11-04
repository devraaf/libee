import { PageHeader } from '../../shared/components/ui/PageHeader';

export interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-8">
      <PageHeader title={title} subtitle={description} />
      <p className="type-small text-muted">
        Esta tela estará disponível em uma próxima etapa.
      </p>
    </section>
  );
}
