import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  size?: 'md' | 'lg' | 'xl' | 'full';
}

interface ModalStackState {
  ids: symbol[];
  previousBodyOverflow: string | null;
}

const modalStacksByDocument = new WeakMap<Document, ModalStackState>();

function getModalStack(document: Document): ModalStackState {
  let state = modalStacksByDocument.get(document);
  if (!state) {
    state = { ids: [], previousBodyOverflow: null };
    modalStacksByDocument.set(document, state);
  }
  return state;
}

const sizeClasses = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-5xl',
  full: 'm-0 h-dvh max-h-dvh max-w-none rounded-none p-4 sm:m-4 sm:h-[90vh] sm:max-h-[90vh] sm:max-w-5xl sm:rounded-xl sm:p-6',
} as const;

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  header,
  size = 'md',
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const modalId = useRef(Symbol('modal'));
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const activeElement = document.activeElement;
    const id = modalId.current;
    const stack = getModalStack(document);
    if (stack.ids.length === 0) {
      stack.previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    stack.ids.push(id);

    const focusInitialElement = () => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const firstField = dialog.querySelector<HTMLElement>(
        '[autofocus], input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
      );
      const firstFocusable = dialog.querySelector<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      (firstField ?? firstFocusable ?? dialog).focus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (stack.ids.at(-1) !== id) return;

      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusableElements =
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        );
      if (!focusableElements?.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    focusInitialElement();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const index = stack.ids.indexOf(id);
      if (index >= 0) stack.ids.splice(index, 1);
      if (stack.ids.length === 0) {
        document.body.style.overflow = stack.previousBodyOverflow ?? '';
        stack.previousBodyOverflow = null;
        modalStacksByDocument.delete(document);
      }
      if (activeElement instanceof HTMLElement && activeElement.isConnected) {
        activeElement.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        tabIndex={-1}
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl border border-line bg-surface p-6 text-fg shadow-card ${sizeClasses[size]}`}
      >
        <div className="mb-4 flex shrink-0 items-start justify-between gap-4">
          <h2 id={titleId} className="type-h3">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-7 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-fg"
          >
            <X size={16} />
          </button>
        </div>

        {header && <div className="shrink-0">{header}</div>}

        <div className="mb-6 min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-line pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
