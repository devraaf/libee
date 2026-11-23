import { Mail, Pencil, Phone, Trash2, User } from 'lucide-react';
import { roleLabels, type Collaborator } from '../types/collaborator.model';

interface CollaboratorCardProps {
  collaborator: Collaborator;
  onEdit?: (collaborator: Collaborator) => void;
  onDelete?: (collaborator: Collaborator) => void;
}

export function CollaboratorCard({
  collaborator,
  onEdit,
  onDelete,
}: CollaboratorCardProps) {
  return (
    <article className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex min-w-0 items-center gap-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-hover text-muted">
          {collaborator.avatarUrl ? (
            <img
              src={collaborator.avatarUrl}
              alt={collaborator.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <User size={22} aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-semibold text-fg">
              {collaborator.name}
            </h2>
            <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
              {roleLabels[collaborator.role]}
            </span>
          </div>

          <p className="flex items-center gap-1.5 truncate text-xs text-muted">
            <Mail size={13} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{collaborator.email}</span>
          </p>

          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Phone size={13} className="shrink-0" aria-hidden="true" />
            <span>{collaborator.phone}</span>
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit?.(collaborator)}
          aria-label={`Editar ${collaborator.name}`}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-fg"
        >
          <Pencil size={17} />
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(collaborator)}
          aria-label={`Excluir ${collaborator.name}`}
          className="rounded-lg p-2 text-danger/80 transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  );
}