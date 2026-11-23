import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { ApiError } from '../../../../shared/api/api-error';
import { Button } from '../../../../shared/components/ui/Button';
import { CollaboratorCard } from '../components/CollaboratorCard';
import CreateCollaboratorForm, {
  type CollaboratorSubmitValues,
} from '../components/CreateCollaboratorForm';
import {
  createCollaborator,
  deleteCollaborator,
  listCollaborators,
  updateCollaborator,
  type AffiliationType,
} from '../service/collaborators.service';
import {
  maskPhone,
  type Collaborator,
  type CollaboratorRole,
} from '../types/collaborator.model';

function mapProfileToRole(profile?: string): CollaboratorRole {
  return profile === 'ADMINISTRATOR' ? 'admin' : 'librarian';
}

function mapRoleToProfile(role: CollaboratorRole): 'ADMINISTRATOR' | 'LIBRARIAN' {
  return role === 'admin' ? 'ADMINISTRATOR' : 'LIBRARIAN';
}

export default function CollaboratorsPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] =
    useState<Collaborator | null>(null);
  const [collaboratorToDelete, setCollaboratorToDelete] =
    useState<Collaborator | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCollaborators() {
      try {
        const data = await listCollaborators();
        if (!active) return;

        const mapped: Collaborator[] = data.map((item) => ({
          id: String(item.id),
          name: item.name,
          email: item.email,
          phone: item.phone ? maskPhone(item.phone) : '',
          role: mapProfileToRole(item.profile),
        }));

        setCollaborators(mapped);
      } catch (error) {
        if (!active) return;
        setPageError(
          error instanceof ApiError
            ? error.message
            : 'Não foi possível carregar os colaboradores.',
        );
      }
    }

    loadCollaborators();
    return () => {
      active = false;
    };
  }, []);

  const filteredCollaborators = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return collaborators;
    return collaborators.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query),
    );
  }, [collaborators, search]);

  const handleOpenCreateModal = () => {
    setActionNotice(null);
    setEditingCollaborator(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (collaborator: Collaborator) => {
    setPageError(null);
    setActionNotice(null);
    setEditingCollaborator(collaborator);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCollaborator(null);
  };

  const handleSaveCollaborator = async (values: CollaboratorSubmitValues) => {
    setPageError(null);
    setActionNotice(null);

    const payload = values as CollaboratorSubmitValues & {
      affiliationType?: AffiliationType;
    };

    if (editingCollaborator) {
      const updated = await updateCollaborator(editingCollaborator.id, {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        profile: mapRoleToProfile(payload.role),
        affiliationType: payload.affiliationType ?? 'EMPLOYEE',
      });

      const updatedItem: Collaborator = {
        id: String(updated.id ?? editingCollaborator.id),
        name: updated.name ?? payload.name,
        email: updated.email ?? payload.email,
        phone: updated.phone
          ? maskPhone(updated.phone)
          : maskPhone(payload.phone),
        role: updated.profile
          ? mapProfileToRole(updated.profile)
          : payload.role,
        avatarUrl: editingCollaborator.avatarUrl,
      };

      setCollaborators((prev) =>
        prev.map((c) => (c.id === editingCollaborator.id ? updatedItem : c)),
      );
      setActionNotice('Colaborador atualizado com sucesso.');
      return;
    }

    try {
      const created = await createCollaborator({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        phone: payload.phone,
        affiliationType: payload.affiliationType ?? 'EMPLOYEE',
      });

      const newItem: Collaborator = {
        id: String(created.id),
        name: created.name,
        email: created.email,
        phone: created.phone ? maskPhone(created.phone) : values.phone,
        role: created.profile ? mapProfileToRole(created.profile) : values.role,
      };

      setCollaborators((prev) => [newItem, ...prev]);
    } catch (error) {
      setPageError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível cadastrar o colaborador.',
      );
      throw error;
    }
  };

  const handleRequestDeleteCollaborator = (target: Collaborator) => {
    setPageError(null);
    setActionNotice(null);
    setCollaboratorToDelete(target);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setCollaboratorToDelete(null);
  };

  const handleConfirmDeleteCollaborator = async () => {
    if (!collaboratorToDelete) return;

    setPageError(null);
    setActionNotice(null);
    setIsDeleting(true);

    try {
      await deleteCollaborator(collaboratorToDelete.id);
      setCollaborators((prev) =>
        prev.filter((c) => c.id !== collaboratorToDelete.id),
      );
      setCollaboratorToDelete(null);
      setActionNotice('Colaborador removido com sucesso.');
    } catch (error) {
      setPageError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível excluir o colaborador.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const isEditing = Boolean(editingCollaborator);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-bold text-fg">Colaboradores</h1>
          <p className="mt-1 text-sm text-muted">
            Gerencie administradores e bibliotecários com acesso ao sistema.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 self-start"
        >
          <Plus size={18} />
          Cadastrar colaborador
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full rounded-lg border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-fg placeholder:text-subtle focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {pageError && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {pageError}
        </div>
      )}

      {actionNotice && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted"
        >
          {actionNotice}
        </div>
      )}

      {filteredCollaborators.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center text-sm text-muted">
          Nenhum colaborador encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredCollaborators.map((collaborator) => (
            <CollaboratorCard
              key={collaborator.id}
              collaborator={collaborator}
              onEdit={handleOpenEditModal}
              onDelete={handleRequestDeleteCollaborator}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-collaborator-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="modal-collaborator-title"
                className="text-lg font-bold text-fg"
              >
                {isEditing ? 'Editar colaborador' : 'Cadastrar colaborador'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                aria-label="Fechar modal"
                className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-fg"
              >
                <X size={18} />
              </button>
            </div>

            <CreateCollaboratorForm
              initialData={
                editingCollaborator
                  ? {
                      name: editingCollaborator.name,
                      email: editingCollaborator.email,
                      phone: editingCollaborator.phone,
                      role: editingCollaborator.role,
                    }
                  : undefined
              }
              submitLabel={isEditing ? 'Salvar alterações' : 'Confirmar'}
              submittingLabel={isEditing ? 'Salvando...' : 'Cadastrando...'}
              onCancel={handleCloseModal}
              onSubmit={handleSaveCollaborator}
            />
          </div>
        </div>
      )}

      {collaboratorToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-collaborator-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2
                id="delete-collaborator-title"
                className="text-lg font-bold text-fg"
              >
                Confirmar exclusão
              </h2>
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={isDeleting}
                aria-label="Fechar confirmação"
                className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-fg disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-muted">
              Tem certeza que deseja excluir{' '}
              <strong className="text-fg">{collaboratorToDelete.name}</strong>?
              Essa ação removerá o acesso do colaborador ao sistema.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDeleteCollaborator}
                disabled={isDeleting}
                className="bg-danger text-white hover:bg-danger/90"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}