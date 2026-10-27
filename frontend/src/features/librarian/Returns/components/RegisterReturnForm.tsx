import type { ActiveLoan } from "../pages/ReturnsPage";

interface RegisterReturnFormProps {
  loan: ActiveLoan;
  onCancel: () => void;
  onConfirm: (loan: ActiveLoan) => void;
}

export default function RegisterReturnForm({
  loan,
  onCancel,
  onConfirm,
}: RegisterReturnFormProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-[#3B2A1A]">
        Devolver <strong className="font-semibold">"{loan.title}"</strong> (tombo{" "}
        <span className="font-mono font-semibold">{loan.copyCode}</span>),
        emprestado a <strong className="font-semibold">{loan.reader}</strong>? O
        exemplar voltará a ficar disponível.
      </p>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[#9A5B00] bg-white px-4 py-2 text-sm font-medium text-[#3B2A1A] hover:bg-[#F9F0DC]"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => onConfirm(loan)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}