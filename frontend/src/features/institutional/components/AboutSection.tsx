export function AboutSection() {
  return (
    <section className="bg-bg py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="max-w-3xl">
          <h2 className="type-overline mb-3 font-semibold uppercase tracking-wider text-primary">
            Sobre o Libee
          </h2>
          <h3 className="type-headline mb-6 font-bold text-fg">
            O que é?
          </h3>
          <p className="type-body leading-relaxed text-muted">
            O Libee é uma solução desenvolvida para modernizar a gestão de bibliotecas, 
            substituindo planilhas manuais e processos burocráticos por um sistema 
            centralizado e intuitivo. Nossa missão é facilitar o acesso à informação, 
            permitindo que bibliotecários gerenciem o acervo com precisão e que leitores 
            encontrem o que precisam de forma rápida e descomplicada.
          </p>
        </div>
      </div>
    </section>
  );
}