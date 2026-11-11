import { useId, useState } from 'react';
import { Check, LoaderCircle, Plus, Tags } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import type { Category } from '@/shared/types/library';
import { createCategory } from '@/shared/services/categories.service';

interface BookCategoryFieldProps {
  categories: Category[];
  selectedCategoryId: number;
  error?: string;
  isLoading: boolean;
  loadError: string | null;
  onRetry: () => void;
  onChange: (categoryId: number) => void;
  onCategoryCreated: (category: Category) => void;
}

export function BookCategoryField({
  categories,
  selectedCategoryId,
  error,
  isLoading,
  loadError,
  onRetry,
  onChange,
  onCategoryCreated,
}: BookCategoryFieldProps) {
  const createPanelId = useId();
  const [name, setName] = useState('');
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const normalizedName = name.trim().toLocaleLowerCase();
  const existingCategory = normalizedName
    ? categories.find(
        (category) =>
          category.name.trim().toLocaleLowerCase() === normalizedName,
      )
    : undefined;

  function closeCreatePanel() {
    if (isCreating) return;
    setIsCreatePanelOpen(false);
    setName('');
    setCreateError(null);
  }

  async function handleCreateCategory() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setCreateError('Informe o nome da categoria.');
      return;
    }
    if (existingCategory) {
      setCreateError('Essa categoria já existe. Selecione-a na lista acima.');
      return;
    }

    setCreateError(null);
    setIsCreating(true);
    try {
      const category = await createCategory(trimmedName);
      onCategoryCreated(category);
      onChange(category.id);
      setName('');
      setIsCreatePanelOpen(false);
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : 'Não foi possível criar a categoria.',
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Select
        label="Categoria *"
        value={selectedCategoryId ? String(selectedCategoryId) : ''}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={isLoading || categories.length === 0 || Boolean(loadError)}
        error={error}
        placeholder={
          isLoading ? 'Carregando categorias...' : 'Selecione uma categoria'
        }
        options={categories.map((category) => ({
          value: String(category.id),
          label: category.name,
        }))}
      />

      {loadError ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-danger-line bg-danger-bg p-3">
          <span className="type-caption text-danger" role="alert">
            {loadError}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <p className="type-caption text-muted">
          Não encontrou a categoria desejada? Cadastre uma nova.
        </p>
      )}

      <div className="flex flex-col items-start">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          leftIcon={<Plus size={16} aria-hidden="true" />}
          aria-expanded={isCreatePanelOpen}
          aria-controls={createPanelId}
          onClick={() => {
            if (isCreatePanelOpen) {
              closeCreatePanel();
            } else {
              setIsCreatePanelOpen(true);
              setCreateError(null);
            }
          }}
          disabled={Boolean(loadError) || isCreating}
          className="-ml-3 text-primary hover:text-primary-hover"
        >
          {isCreatePanelOpen ? 'Fechar cadastro' : 'Adicionar categoria'}
        </Button>
        {isCreatePanelOpen && (
          <section
            id={createPanelId}
            aria-label="Adicionar nova categoria"
            className="w-full rounded-xl border border-line bg-surface p-4"
          >
            <div className="mb-3 flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-chip text-primary">
                <Tags size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="type-small font-semibold text-fg">
                  Nova categoria
                </h3>
                <p className="type-caption mt-0.5 text-muted">
                  Ela será adicionada à lista e selecionada para este livro.
                </p>
              </div>
            </div>

            <Input
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setCreateError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void handleCreateCategory();
                }
              }}
              maxLength={255}
              placeholder="Ex.: Literatura brasileira"
              label="Nome da categoria"
              error={
                createError ??
                (existingCategory
                  ? 'Essa categoria já existe. Selecione-a na lista acima.'
                  : undefined)
              }
              disabled={isCreating}
              autoFocus
            />

            <div className="mt-3 flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={closeCreatePanel}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => void handleCreateCategory()}
                disabled={
                  isCreating || !name.trim() || Boolean(existingCategory)
                }
                leftIcon={
                  isCreating ? (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Check size={16} aria-hidden="true" />
                  )
                }
              >
                {isCreating ? 'Criando categoria...' : 'Criar e selecionar'}
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
