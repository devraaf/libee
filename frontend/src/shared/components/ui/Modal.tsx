import { useEffect, useId, type ReactNode } from 'react';
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

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
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
