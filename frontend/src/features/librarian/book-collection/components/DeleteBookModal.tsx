import { AlertTriangle } from 'lucide-react';
import { Modal } from '../../../../shared/components/ui/Modal';

interface DeleteBookModalProps {
  open: boolean;
  bookTitle: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteBookModal({
  open,
  bookTitle,
  onClose,
  onConfirm,
}: DeleteBookModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="">
      <div className="flex flex-col gap-4 p-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle size={24} />
        </div>

        <div>
          <h3 className="text-lg font-bold text-[#3B2A1A]">Excluir livro do acervo</h3>
          <p className="mt-2 text-sm text-[#6B5A45]">
            Tem certeza que deseja remover a obra <strong className="text-[#3B2A1A]">"{bookTitle}"</strong> e todos os seus exemplares do catálogo? Esta ação não pode ser desfeita.
          </p>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#6B5A45] bg-white px-4 py-2 text-sm font-medium text-[#3B2A1A] hover:bg-[#F9F0DC]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Confirmar exclusão
          </button>
        </div>
      </div>
    </Modal>
  );
}