interface SuccessToastProps {
  message: string | null;
}

export function SuccessToast({ message }: SuccessToastProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-5 right-5 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all"
    >
      {message}
    </div>
  );
}
