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

- [Node.js](https://nodejs.org/) `>=22.22.0` (necessário para o React Router instalado)
- npm 10.9.2 (versão registrada no `package.json`)
- Git

## Instalação

A partir da raiz do repositório:

```bash
cd frontend
npm ci
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
| `npm run lint`         | Executa o ESLint sem corrigir arquivos                    |
| `npm run lint:fix`     | Corrige automaticamente problemas corrigíveis pelo ESLint |
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

`lint` encontra problemas estáticos; `format` padroniza a apresentação do código; `typecheck` analisa os tipos TypeScript. O comando `build` também verifica os tipos antes de gerar os arquivos de produção.

## Build

```bash
npm run build
```

O build deve concluir sem erros antes de abrir qualquer Pull Request.
