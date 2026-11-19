import { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/Button';
import { CollaboratorCard } from '../components/CollaboratorCard';
import CreateCollaboratorForm from '../components/CreateCollaboratorForm';
import type {
  Collaborator,
  CollaboratorFormValues,
} from '../types/collaborator.model';

const mockCollaborators: Collaborator[] = [
  {
    id: '1',
    name: 'Maria Clara Almeida',
    email: 'mariaclaraalmeida@fatec.sp.gov.br',
    phone: '(11) 97727-7665',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Gabriel Martins',
    email: 'gabrielmartins@fatec.sp.gov.br',
    phone: '(11) 96331-8590',
    role: 'librarian',
  },
  {
    id: '3',
    name: 'Sophia Ribeiro',
    email: 'sophiaribeiro@fatec.sp.gov.br',
    phone: '(11) 97996-6044',
    role: 'admin',
  },
  {
    id: '4',
    name: 'Arthur Ferreira',
    email: 'arthurferreira@fatec.sp.gov.br',
    phone: '(11) 94538-9131',
    role: 'librarian',
  },
];

export default function CollaboratorsPage() {
  const [collaborators, setCollaborators] =
    useState<Collaborator[]>(mockCollaborators);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] =
    useState<Collaborator | null>(null);

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
    setEditingCollaborator(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (collaborator: Collaborator) => {
    setEditingCollaborator(collaborator);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCollaborator(null);
  };

  const handleSaveCollaborator = async (values: CollaboratorFormValues) => {
    if (editingCollaborator) {
      setCollaborators((prev) =>
        prev.map((item) =>
          item.id === editingCollaborator.id ? { ...item, ...values } : item,
        ),
      );
      return;
    }

    const newItem: Collaborator = {
      id: crypto.randomUUID(),
      ...values,
    };
    setCollaborators((prev) => [newItem, ...prev]);
  };

  const handleDeleteCollaborator = (target: Collaborator) => {
    setCollaborators((prev) => prev.filter((item) => item.id !== target.id));
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
              onDelete={handleDeleteCollaborator}
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
    </section>
  );
}