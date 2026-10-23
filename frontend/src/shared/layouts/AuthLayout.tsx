import type { ReactNode } from 'react'
import beePattern from '../../assets/bee-pattern.svg'

export interface AuthLayoutProps {
  children: ReactNode
}

/** Painel esquerdo com o pattern + painel direito com o formulário. */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh bg-gradient-to-b from-[#3f2400] to-[#8a5200]">
      <aside aria-hidden="true" className="relative z-0 hidden shrink-0 overflow-hidden lg:block lg:w-[44%]">
        <div
          className="absolute inset-0 origin-center scale-[1.6] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${beePattern})` }}
        />
      </aside>
      <main className="relative z-10 flex min-h-dvh flex-1 flex-col bg-bg px-6 py-10 lg:-ml-8 lg:rounded-l-[2rem]">
        <div className="mx-auto my-auto flex w-full max-w-sm flex-col items-center gap-6">{children}</div>
      </main>
    </div>
  )
}