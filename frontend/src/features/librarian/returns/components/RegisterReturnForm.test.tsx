import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RegisterReturnForm from './RegisterReturnForm';

describe('RegisterReturnForm', () => {
  it('sends the accession number and displays the API error message', async () => {
    const onConfirm = vi
      .fn()
      .mockRejectedValue(
        new Error('Não há empréstimo ativo para o tombo T-404.'),
      );

    render(<RegisterReturnForm onCancel={vi.fn()} onConfirm={onConfirm} />);

    fireEvent.change(screen.getByLabelText('Tombo do exemplar'), {
      target: { value: 'T-404' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(
      await screen.findByText('Não há empréstimo ativo para o tombo T-404.'),
    ).toBeTruthy();
    expect(onConfirm).toHaveBeenCalledWith('T-404');
  });
});
