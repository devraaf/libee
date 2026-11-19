import { Library, Settings, Users } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

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
    <section id="proposta" className="bg-bg-secondary py-20 sm:py-24 lg:py-28" aria-label="Nossa proposta">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <SectionHeading eyebrow="Nossa proposta" title="O que o Libee oferece?" />
        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8 lg:mt-16 lg:gap-12">
          {features.map((feature, index) => (
             <article
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
             </article>
           ))}
        </div>
      </div>
    </section>
  );
}