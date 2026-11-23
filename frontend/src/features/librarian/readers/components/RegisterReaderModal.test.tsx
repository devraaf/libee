import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/api/api-error';

const { register, listCourses } = vi.hoisted(() => ({
  register: vi.fn(),
  listCourses: vi.fn(),
}));

vi.mock('@/features/auth/services/auth.service', () => ({ register }));
vi.mock('@/features/courses/services/course.service', () => ({ listCourses }));

import RegisterReaderModal from './RegisterReaderModal';

describe('RegisterReaderModal', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.resetAllMocks();
    listCourses.mockResolvedValue([{ id: 7, name: 'Sistemas' }]);
  });

  it('validates required fields before registering', async () => {
    render(<RegisterReaderModal open onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Cadastrar leitor' }),
    );

    expect(await screen.findByText('Informe seu nome completo.')).toBeTruthy();
    expect(screen.getByText('Informe seu e-mail.')).toBeTruthy();
    expect(register).not.toHaveBeenCalled();
  });

  it('submits using the shared public fields and calls onSuccess with the created reader', async () => {
    const reader = {
      id: 42,
      name: 'Ana Silva',
      email: 'ana@example.com',
      profile: 'READER',
    };
    register.mockResolvedValue(reader);
    const onSuccess = vi.fn();

    render(
      <RegisterReaderModal
        open
        onClose={vi.fn()}
        onSuccess={onSuccess}
        initialValue="ana@example.com"
      />,
    );

    fireEvent.change(await screen.findByLabelText('Nome completo'), {
      target: { value: 'Ana Silva' },
    });
    fireEvent.click(screen.getByLabelText('Funcionário'));
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'SenhaInicial1' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar Senha'), {
      target: { value: 'SenhaInicial1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar leitor' }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Ana Silva',
          email: 'ana@example.com',
          affiliationType: 'EMPLOYEE',
          password: 'SenhaInicial1',
        }),
      );
      expect(onSuccess).toHaveBeenCalledWith(reader);
    });
  });

  it('shows API field and general errors without closing the modal', async () => {
    register.mockRejectedValue(
      new ApiError('Já existe um usuário com este e-mail.', 409),
    );

    render(<RegisterReaderModal open onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.change(await screen.findByLabelText('Nome completo'), {
      target: { value: 'Ana Silva' },
    });
    fireEvent.click(screen.getByLabelText('Funcionário'));
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'SenhaInicial1' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar Senha'), {
      target: { value: 'SenhaInicial1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar leitor' }));

    expect(
      await screen.findByText('Já existe um usuário com este e-mail.'),
    ).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('maps API validation errors to the matching form fields', async () => {
    register.mockRejectedValue(
      new ApiError('Um ou mais campos são inválidos.', 400, undefined, {
        errors: [{ field: 'email', message: 'E-mail já cadastrado.' }],
      }),
    );

    render(<RegisterReaderModal open onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.change(await screen.findByLabelText('Nome completo'), {
      target: { value: 'Ana Silva' },
    });
    fireEvent.click(screen.getByLabelText('Funcionário'));
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'SenhaInicial1' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar Senha'), {
      target: { value: 'SenhaInicial1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar leitor' }));

    expect(await screen.findByText('E-mail já cadastrado.')).toBeTruthy();
  });

  it('prefills only the email field for a compatible search query', async () => {
    render(
      <RegisterReaderModal
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        initialValue="ana@example.com"
      />,
    );

    expect(await screen.findByDisplayValue('ana@example.com')).toBeTruthy();
    expect(screen.getByLabelText('Senha')).toHaveProperty('value', '');
  });
});
