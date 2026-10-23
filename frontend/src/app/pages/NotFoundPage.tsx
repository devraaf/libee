import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-bg text-fg">
      <div className="flex flex-col items-center justify-center text-center max-w-lg w-full">
        <div
          aria-hidden="true"
          className="relative flex items-center justify-center select-none my-6"
        >
          {/* Primeiro número 4 */}
          <span className="text-9xl sm:text-[12rem] font-extrabold text-fg leading-none flex items-center">
            4
          </span>

          {/* SVG da Colmeia */}
          <img
            src="/images/hive-notFound.svg"
            alt=""
            className="w-36 h-36 sm:w-52 sm:h-52 object-contain -mx-3 sm:-mx-5 z-10"
          />

          {/* Segundo número 4 */}
          <span className="text-9xl sm:text-[12rem] font-extrabold text-fg leading-none flex items-center">
            4
          </span>
        </div>

        {/* Textos explicativos */}
        <h1 className="text-2xl sm:text-3xl font-bold text-fg mb-2">
          Página não encontrada
        </h1>

        <p className="type-small text-muted mb-6 leading-relaxed max-w-sm">
          Nossas abelhas procuraram por todo o lado, mas não encontraram esta
          página.
        </p>

        <Link
          to="/"
          className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-8 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover active:bg-primary-active sm:w-auto"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
