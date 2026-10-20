import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from './cn';
import { IconButton } from './IconButton';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Linha de ações (botões) exibida no rodapé. */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

/** Modal baseado em <dialog>: foco preso, ESC fecha, clique no fundo fecha. */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        'm-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-fg shadow-card backdrop:bg-black/50',
        sizes[size],
        className,
      )}
    >
      <div className="flex flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="type-h3">
            {title}
          </h2>
          <IconButton
            label="Fechar"
            icon={<X size={18} />}
            onClick={onClose}
            className="-mr-2 -mt-1"
          />
        </div>
        {children}
        {footer && (
          <div className="flex flex-wrap justify-end gap-3">{footer}</div>
        )}
      </div>
    </dialog>
  );
}
