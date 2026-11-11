import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createCategory } = vi.hoisted(() => ({
  createCategory: vi.fn(),
}));

vi.mock('@/shared/services/categories.service', () => ({
  createCategory,
}));

import { BookCategoryField } from './BookCategoryField';

describe('BookCategoryField', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.resetAllMocks();
  });

  function renderField() {
    const onCategoryCreated = vi.fn();
    const onChange = vi.fn();
    render(
      <BookCategoryField
        categories={[{ id: 3, name: 'Tecnologia' }]}
        selectedCategoryId={0}
        isLoading={false}
        loadError={null}
        onRetry={vi.fn()}
        onChange={onChange}
        onCategoryCreated={onCategoryCreated}
      />,
    );
    return { onCategoryCreated, onChange };
  }

  it('opens category creation only when requested and selects the new category', async () => {
    createCategory.mockResolvedValue({ id: 9, name: 'Literatura' });
    const { onCategoryCreated, onChange } = renderField();

    expect(screen.queryByLabelText('Nome da categoria')).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Adicionar categoria' }),
    );
    fireEvent.change(screen.getByLabelText('Nome da categoria'), {
      target: { value: '  Literatura  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar e selecionar' }));

    await waitFor(() => {
      expect(createCategory).toHaveBeenCalledWith('Literatura');
      expect(onCategoryCreated).toHaveBeenCalledWith({
        id: 9,
        name: 'Literatura',
      });
      expect(onChange).toHaveBeenCalledWith(9);
    });
    expect(screen.queryByLabelText('Nome da categoria')).toBeNull();
  });

  it('prevents creating a category that already exists', () => {
    renderField();

    fireEvent.click(
      screen.getByRole('button', { name: 'Adicionar categoria' }),
    );
    fireEvent.change(screen.getByLabelText('Nome da categoria'), {
      target: { value: ' tecnologia ' },
    });

    expect(
      screen.getByText('Essa categoria já existe. Selecione-a na lista acima.'),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Criar e selecionar' }),
    ).toHaveProperty('disabled', true);
    expect(createCategory).not.toHaveBeenCalled();
  });
});
