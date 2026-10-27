# Libee Frontend

Interface web do **Libee**, sistema de gestão de biblioteca acadêmica desenvolvido inicialmente para a biblioteca da Fatec Cotia.

Esta etapa cobre apenas o front-end, seguindo o wireframe do projeto. Não há back-end, banco de dados nem chamadas a APIs externas. Quando uma tela precisar exibir informações, são usados dados locais fictícios apenas para representar o wireframe.

## Tecnologias

- [React](https://react.dev/) com TypeScript
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/) para navegação
- [Axios](https://axios-http.com/) para futuras integrações com o back-end
- [Zod](https://zod.dev/) para validação de formulários
- [Lucide React](https://lucide.dev/) para ícones

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20.19 ou superior
- npm (já vem com o Node.js)
- Git

## Instalação

A partir da raiz do repositório:

```bash
cd frontend
npm install
```

## Executar em desenvolvimento

```bash
npm run dev
```

A aplicação fica disponível em `http://localhost:5173`.

## Scripts disponíveis

| Comando                | Descrição                                                 |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Inicia o servidor de desenvolvimento                      |
| `npm run build`        | Verifica os tipos e gera o build de produção              |
| `npm run preview`      | Visualiza localmente o build de produção                  |
| `npm run lint`         | Executa o Oxlint sem corrigir arquivos                    |
| `npm run lint:fix`     | Corrige automaticamente problemas corrigíveis pelo Oxlint |
| `npm run format`       | Formata os arquivos-fonte e de configuração com Prettier  |
| `npm run format:check` | Verifica a formatação sem alterar arquivos                |
| `npm run typecheck`    | Verifica os tipos TypeScript sem gerar build              |

## Estrutura de pastas

O projeto usa arquitetura **feature-based**: o código é organizado por funcionalidade, separado dos componentes reutilizáveis e das configurações da aplicação.

```text
frontend/
├── public/
│   └── images/                 # Arquivos servidos diretamente
│
└── src/
    ├── app/
    │   ├── App.tsx             # Composição e provedor de rotas
    │   ├── routes/             # Rotas globais quando houver páginas
    │   └── providers/          # Providers globais necessários
    ├── features/               # Funcionalidades, criadas conforme forem desenvolvidas
    ├── test/                   # Configurações, fixtures e utilitários compartilhados de teste
    ├── shared/
    │   ├── api/                # Cliente HTTP compartilhado
    │   ├── components/         # Componentes realmente reutilizados
    │   ├── hooks/              # Hooks compartilhados
    │   ├── utils/               # Utilitários sem domínio de feature
    │   └── types/              # Tipos compartilhados
    ├── assets/                 # Recursos importados no código
    ├── index.css               # Estilos globais e entrada do Tailwind 4
    └── main.tsx                # Ponto de entrada
```

Testes específicos de uma feature ou componente devem ficar próximos do código testado; use `src/test/` para recursos compartilhados entre diferentes testes.

## Rotas e layouts

As rotas da aplicação ficam em `src/app/routes/AppRoutes.tsx`. O único layout
definido é o `MainLayout`, que reúne o header, o conteúdo da rota e o footer. O
perfil informado pela rota (`public`, `reader` ou `librarian`) configura os
links exibidos no header; isso ainda não representa autenticação nem protege o
acesso às páginas. A página institucional usa o `MainLayout` com perfil
`public`; acervo, empréstimos e detalhe do livro usam perfil `reader`; e as
rotas de gerenciamento usam perfil `librarian`. Login e cadastro usam o layout
de autenticação próprio, e a página 404 é exibida sem layout. Telas ainda não
implementadas usam páginas provisórias.

## Mocks e services

Os dados de demonstração ficam em `src/shared/mocks/`; os contratos TypeScript compartilhados ficam em `src/shared/types/library.ts` e seguem o formato descrito em [`../docs/test-data/README.md`](../docs/test-data/README.md). O estado dos mocks vive em memória no módulo e permanece sincronizado entre services até a página ser recarregada. Os services são organizados por domínio em `src/features/<feature>/services/` e retornam `Promise` com atraso de 300 a 600 ms.

As listagens usam os mesmos parâmetros e o mesmo formato paginado previsto para a API. Em livros, `available` é derivado dos exemplares. O status dos empréstimos é recalculado pelas datas em cada consulta. Para capas sem imagem, use o recurso local `public/images/book-cover-placeholder.svg` quando `coverImageUrl` for `null`. Para conferir estados de erro, busque por `simular erro`; na consulta de ISBN, os exemplos de sucesso, não encontrado, serviço indisponível e já cadastrado estão documentados em `isbn-lookup.service.ts`.

### Exemplo: listar leitores em uma tela

Importe e chame a função do service como qualquer operação assíncrona. A tela controla os estados de carregamento, sucesso e erro; o service não depende de React:

```tsx
import { useEffect, useState } from 'react';
import { listReaders } from '../services/readers.service';
import type { Reader } from '../../../shared/types/library';

export function ReadersPage() {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadReaders() {
      try {
        const result = await listReaders();
        if (active) setReaders(result);
      } catch {
        if (active) setError('Não foi possível carregar os leitores.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadReaders();
    return () => {
      active = false;
    };
  }, []);

  if (isLoading) return <p>Carregando leitores...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <ul>
      {readers.map((reader) => (
        <li key={reader.id}>
          {reader.name} — {reader.email}
        </li>
      ))}
    </ul>
  );
}
```

Para experimentar a busca e o cadastro, `listReaders('Eduardo')` filtra os registros e `createReader` insere um novo leitor no estado em memória. As chamadas abaixo também podem ser feitas em handlers `async` de formulários:

```ts
import { createReader, listReaders } from './readers.service';

const matchingReaders = await listReaders('Eduardo');

const newReader = await createReader({
  name: 'Pessoa de Teste',
  email: 'pessoa.teste@example.com',
  password: 'Libee@2026',
  phone: null,
  affiliationType: 'STUDENT',
  courseId: 1,
});
```

`listReaders('simular erro')` rejeita a Promise para permitir testar a apresentação de erros. Erros de negócio também são entregues como rejeições (`MockServiceError`), por exemplo ao cadastrar um e-mail duplicado ou excluir um leitor vinculado a empréstimos. Trate essas rejeições na tela ou no handler que chama o service. Os dados alterados são compartilhados entre os services durante a sessão da página e voltam ao estado inicial após recarregar.

Há usuários fictícios compatíveis com o contrato de `docs/test-data/README.md`; todos usam a senha `Libee@2026`:

| Perfil para teste                   | E-mail                         |
| ----------------------------------- | ------------------------------ |
| Leitor aluno (Eduardo Lima)         | `eduardo.lima@example.com`     |
| Leitor professor (Henrique Azevedo) | `henrique.azevedo@example.com` |
| Bibliotecário (Carlos Mendes)       | `carlos.mendes@example.com`    |

Para trocar um service simulado por Axios, mantenha sua assinatura, tipos de entrada e saída, e substitua somente o corpo pela chamada ao `httpClient`. Por exemplo:

```ts
export async function listBooks(params: ListBooksParams) {
  const { data } = await httpClient.get<PaginatedResult<BookListItem>>(
    '/books',
    { params },
  );
  return data;
}
```

O cliente Axios compartilhado está em `src/shared/api/http-client.ts`; configure `VITE_API_BASE_URL` no ambiente local. Não adicione chamadas HTTP aos mocks.

As pastas de cada funcionalidade em `src/features/` são criadas conforme as respectivas Issues forem desenvolvidas, seguindo este padrão:

```text
features/
└── nome-da-feature/
    ├── components/
    ├── hooks/
    ├── services/    # chamadas HTTP específicas da feature
    ├── schemas/     # validações específicas da feature
    └── types/
```

## Convenções

- Componentes em TypeScript, pequenos e com responsabilidade única.
- Estilização com Tailwind CSS.
- Rotas com React Router, importando sempre de `react-router`.
- Pastas de features em `kebab-case`; componentes em `PascalCase`; hooks com prefixo `use`; funções e variáveis em `camelCase`; tipos em `PascalCase`.
- Tipos, schemas e serviços ficam junto da feature que os utiliza; mova-os para `shared` apenas quando forem reutilizados.
- A URL da API é configurada por `VITE_API_BASE_URL`; use `.env.example` como referência e crie um `.env` local para desenvolvimento.
- Sem duplicação de código e sem funcionalidades fora do wireframe ou das Issues.

`lint` encontra problemas estáticos com Oxlint; `format` padroniza a apresentação do código; `typecheck` analisa os tipos TypeScript. O comando `build` também verifica os tipos antes de gerar os arquivos de produção.

## Build

```bash
npm run build
```

O build deve concluir sem erros antes de abrir qualquer Pull Request.
