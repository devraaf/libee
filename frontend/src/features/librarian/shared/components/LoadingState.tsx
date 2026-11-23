import { Loader } from '@/shared/components/ui/loader/Loader';

interface LoadingStateProps {
  label: string;
}

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div
      className="flex min-h-48 items-center justify-center"
      role="status"
      aria-label={label}
    >
      <Loader />
    </div>
  );
}
