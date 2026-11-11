import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Modal from './Modal';

describe('Modal stacking', () => {
  afterEach(() => {
    cleanup();
    document.body.style.overflow = '';
  });

  it('closes only the top modal with Escape and keeps page scrolling locked', () => {
    const onCloseOuter = vi.fn();
    const onCloseInner = vi.fn();
    function NestedModals() {
      const [isInnerOpen, setIsInnerOpen] = useState(false);
      const [isOuterOpen, setIsOuterOpen] = useState(true);
      return (
        <Modal
          isOpen={isOuterOpen}
          onClose={() => {
            onCloseOuter();
            setIsOuterOpen(false);
          }}
          title="Empréstimo"
        >
          <button type="button" onClick={() => setIsInnerOpen(true)}>
            Cadastrar leitor
          </button>
          <Modal
            isOpen={isInnerOpen}
            onClose={() => {
              onCloseInner();
              setIsInnerOpen(false);
            }}
            title="Cadastro de leitor"
          >
            <input aria-label="Nome do leitor" autoFocus />
          </Modal>
        </Modal>
      );
    }

    render(<NestedModals />);
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar leitor' }));

    expect(screen.getAllByRole('dialog')).toHaveLength(2);
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCloseInner).toHaveBeenCalledOnce();
    expect(onCloseOuter).not.toHaveBeenCalled();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCloseOuter).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });
});
