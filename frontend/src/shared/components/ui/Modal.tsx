import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode; // <--- 1. Adicionado aqui (opcional)
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-[#E7DCC4] bg-white p-6 text-[#3B2A1A] shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[#F9F0DC]"
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Conteúdo principal */}
        <div className="mb-6">
          {children}
        </div>

        {/* 2. Rodapé do modal renderizado aqui caso seja passado */}
        {footer && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}