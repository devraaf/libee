import { BookPlus, RefreshCcw, Search, BarChart3 } from 'lucide-react';

const steps = [
  {
    icon: BookPlus,
    title: 'Cadastre',
    description: 'os livros e exemplares no sistema',
  },
  {
    icon: RefreshCcw,
    title: 'Gerencie',
    description: 'a circulação e empréstimos dos materiais',
  },
  {
    icon: Search,
    title: 'Consulte',
    description: 'o catálogo e o histórico de forma rápida',
  },
  {
    icon: BarChart3,
    title: 'Acompanhe',
    description: 'as informações e relatórios da biblioteca',
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-bg py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="mb-16 text-center">
          <h2 className="type-overline mb-3 font-semibold uppercase tracking-wider text-primary">
            Como Funciona
          </h2>
          <h3 className="type-headline font-bold text-fg">
            Fluxo simples e eficiente
          </h3>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={index} className="relative flex flex-col items-center text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-line bg-surface text-primary">
                <step.icon size={28} aria-hidden="true" />
              </div>
              <h4 className="type-title mb-2 font-semibold text-fg">
                {step.title}
              </h4>
              <p className="type-small text-muted">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}