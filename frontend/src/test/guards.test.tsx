import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/app/providers/auth/AuthProvider';
import { ThemeProvider } from '@/app/providers/theme/ThemeProvider';
import { NotFoundPage } from '@/app/pages/NotFoundPage';
import { MainLayout } from '@/app/layout/MainLayout';
import {
  saveSession,
  SESSION_STORAGE_KEY,
  type StoredSession,
} from '@/features/auth/storage/session-storage';
import type { UserProfile } from '@/shared/schemas/enums.schema';
import { ProtectedRoute } from '../app/routes/ProtectedRoute';
import { PublicOnlyRoute } from '../app/routes/PublicOnlyRoute';
import { homePathByProfile } from '../app/routes/homePathByProfile';

function session(profile: UserProfile): StoredSession {
  return {
    token: 'test-token',
    user: { id: 1, profile },
  };
}

function LoginDestination() {
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from
    ?.pathname;

  return (
    <p data-testid="location">
      {location.pathname}:{from ?? ''}
    </p>
  );
}

function renderAt(path: string) {
  // Harness isolado dos guards; o mapeamento de perfis do AppRoutes é validado separadamente.
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/entrar" element={<LoginDestination />} />
          </Route>
          <Route element={<ProtectedRoute allowedProfiles={['READER']} />}>
            <Route path="/acervo" element={<p>Acervo protegido</p>} />
          </Route>
          <Route
            element={
              <ProtectedRoute allowedProfiles={['READER', 'LIBRARIAN']} />
            }
          >
            <Route
              path="/livros/:id"
              element={<p>Detalhe do livro protegido</p>}
            />
          </Route>
          <Route element={<ProtectedRoute allowedProfiles={['LIBRARIAN']} />}>
            <Route
              path="/gerenciamento/acervo"
              element={<p>Home do bibliotecário</p>}
            />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

function renderWithLayout() {
  render(
    <MemoryRouter initialEntries={['/acervo']}>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route element={<MainLayout profile="reader" />}>
              <Route path="/acervo" element={<p>Acervo protegido</p>} />
            </Route>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/entrar" element={<p>Login público</p>} />
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('route guards', () => {
  it('redireciona visitantes ao login e preserva o destino', () => {
    renderAt('/acervo');

    expect(screen.getByTestId('location').textContent).toBe('/entrar:/acervo');
  });

  it('permite acesso ao perfil autorizado', () => {
    saveSession(session('READER'));

    renderAt('/acervo');

    expect(screen.getByText('Acervo protegido')).toBeTruthy();
  });

  it('permite que bibliotecário abra o detalhe do livro', () => {
    saveSession(session('LIBRARIAN'));

    renderAt('/livros/42');

    expect(screen.getByText('Detalhe do livro protegido')).toBeTruthy();
  });

  it('redireciona o perfil não autorizado para sua home', () => {
    saveSession(session('LIBRARIAN'));

    renderAt('/acervo');

    expect(screen.getByText('Home do bibliotecário')).toBeTruthy();
  });

  it('redireciona uma sessão ativa ao abrir o login', () => {
    saveSession(session('READER'));

    renderAt('/entrar');

    expect(screen.getByText('Acervo protegido')).toBeTruthy();
  });

  it('mantém o destino planejado do administrador sem entrar em loop', () => {
    saveSession(session('ADMINISTRATOR'));

    renderAt('/entrar');

    expect(homePathByProfile.ADMINISTRATOR).toBe('/administracao/leitores');
    // Atualizar este cenário quando a home admin entrar no AppRoutes.
    expect(
      screen.getByRole('heading', { name: 'Página não encontrada' }),
    ).toBeTruthy();
  });

  it('renderiza a página não encontrada em uma rota desconhecida', () => {
    renderAt('/rota-inexistente');

    expect(
      screen.getByRole('heading', { name: 'Página não encontrada' }),
    ).toBeTruthy();
  });

  it('cancela a confirmação de logout sem encerrar a sessão', async () => {
    saveSession(session('READER'));
    renderWithLayout();

    // Há um botão em cada layout responsivo; ambos abrem a mesma confirmação.
    fireEvent.click(screen.getAllByRole('button', { name: 'Sair' })[0]);
    expect(
      screen.getByRole('heading', { name: 'Encerrar sessão' }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => {
      expect(screen.getByText('Acervo protegido')).toBeTruthy();
      expect(localStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull();
    });
  });

  it('encerra a sessão após confirmação e volta para o login', async () => {
    saveSession(session('READER'));
    renderWithLayout();

    fireEvent.click(screen.getAllByRole('button', { name: 'Sair' })[0]);
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Sair' }),
    );

    await waitFor(() => {
      expect(screen.getByText('Login público')).toBeTruthy();
      expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    });
  });
});
