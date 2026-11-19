import { ExternalLink, PlayCircle } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

const demoVideoUrl = 'https://youtu.be/G2najqGO3Iw?si=dv1iYRgYijxq4JpL';

export function AboutSection() {
  return (
    <section
      id="sobre"
      className="bg-bg py-20 sm:py-24 lg:py-28"
      aria-label="Sobre o Libee"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.7fr)] lg:items-center lg:gap-20 lg:px-10">
        <div>
          <SectionHeading eyebrow="Sobre o Libee" title="O que é?" />
          <p className="type-body mt-6 max-w-3xl text-muted">
            O Libee é uma solução desenvolvida para modernizar a gestão de
            bibliotecas, substituindo planilhas manuais e processos burocráticos
            por um sistema centralizado e intuitivo. Nossa missão é facilitar o
            acesso à informação, permitindo que bibliotecários gerenciem o
            acervo com precisão e que leitores encontrem o que precisam de forma
            rápida e descomplicada.
          </p>
        </div>

        <div className="float relative rounded-4xl border border-line bg-bg/80 p-3 shadow-2xl backdrop-blur-sm">
            <a
              href={demoVideoUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Assistir à demonstração do Libee no YouTube"
              className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-[1.35rem] bg-fg text-white transition duration-300 hover:scale-[1.01]"
            >
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(195,120,0,0.42),transparent_36%),linear-gradient(135deg,#111111_10%,#2b1a04_100%)]" />
              <span className="relative flex flex-col items-center gap-3 text-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition duration-300 group-hover:scale-110 group-hover:bg-primary-hover">
                  <PlayCircle size={30} aria-hidden="true" />
                </span>
                <span className="type-label">Assistir à demonstração</span>
                <span className="type-caption text-white/70">
                  Abrir no YouTube
                </span>
              </span>
              <span className="pointer-events-none absolute inset-0 rounded-[1.35rem] ring-1 ring-inset ring-white/15" />
            </a>
            <div className="flex items-center justify-between gap-4 px-2 pb-1 pt-4">
              <div>
                <p className="type-label text-fg">
                  Veja uma demonstração rápida
                </p>
              </div>
              <a
                href={demoVideoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-primary transition hover:bg-primary/10"
                aria-label="Abrir demonstração do Libee no YouTube"
              >
                <ExternalLink size={18} aria-hidden="true" />
                <span className="sr-only">Abrir no YouTube</span>
              </a>
            </div>
          </div>
      </div>
    </section>
  );
}
