import { Library, Settings, Users } from 'lucide-react';

const features = [
  {
    icon: Library,
    title: 'Reduzir tarefas manuais',
    description: 'Menos planilhas, mais agilidade e precisão nas informações do acervo.',
  },
  {
    icon: Settings,
    title: 'Facilitar o gerenciamento',
    description: 'Controle total de exemplares, empréstimos e devoluções em um só lugar.',
  },
  {
    icon: Users,
    title: 'Organizar o acesso',
    description: 'Consulta ao catálogo e informações da biblioteca para todos os usuários.',
  },
];

export function FeaturesSection() {
  return (
    <section className="bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="mb-16 text-center">
          <h2 className="type-overline mb-3 font-semibold uppercase tracking-wider text-primary">
            Nossa Proposta
          </h2>
          <h3 className="type-headline font-bold text-fg">
            O que o Libee oferece?
          </h3>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group rounded-xl border border-line bg-bg p-8 transition-all hover:border-primary/50 hover:shadow-sm"
            >
              <div className="mb-6 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
                <feature.icon size={28} aria-hidden="true" />
              </div>
              <h4 className="type-title mb-3 font-semibold text-fg">
                {feature.title}
              </h4>
              <p className="type-body text-muted">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}