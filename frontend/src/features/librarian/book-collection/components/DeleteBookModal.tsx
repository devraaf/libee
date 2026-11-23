import { AlertTriangle } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/Button';
import Modal from '../../../../shared/components/ui/Modal';

interface DeleteBookModalProps {
  open: boolean;
  bookTitle: string | null;
  isDeleting: boolean;
  error: string | null;
  blockedAccessionNumbers?: string[];
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteBookModal({
  open,
  bookTitle,
  isDeleting,
  error,
  blockedAccessionNumbers = [],
  onClose,
  onConfirm,
}: DeleteBookModalProps) {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Excluir livro do acervo"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting || !bookTitle}
          >
            {isDeleting ? 'Excluindo...' : 'Confirmar exclusão'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
          <AlertTriangle size={24} aria-hidden="true" />
        </div>
        <p className="type-body text-muted">
          Tem certeza que deseja remover a obra{' '}
          <strong className="text-fg">“{bookTitle}”</strong> do acervo? Os
          exemplares também serão excluídos do acervo, e o histórico de
          empréstimos será preservado.
        </p>
        <p className="type-small text-muted">
          A obra não aparecerá mais no acervo e não poderá receber novos
          empréstimos.
        </p>
        {error && (
          <p className="type-small text-danger" role="alert">
            {error}
            {blockedAccessionNumbers.length > 0 && (
              <>
                <br />
                Tombos bloqueados: {blockedAccessionNumbers.join(', ')}
              </>
            )}
          </p>
        )}
      </div>
    </Modal>
  );
}
