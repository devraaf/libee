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

| Comando           | Descrição                                      |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Inicia o servidor de desenvolvimento           |
| `npm run build`   | Verifica os tipos e gera o build de produção   |
| `npm run preview` | Visualiza localmente o build de produção       |
| `npm run lint`    | Executa o ESLint                               |

## Estrutura de pastas

O projeto usa arquitetura **feature-based**: o código é organizado por funcionalidade, separado dos componentes reutilizáveis e das configurações da aplicação.

```text
frontend/
├── public/
│   └── images/            # Imagens estáticas (logos)
│
└── src/
    ├── app/
    │   ├── routes/        # Definição das rotas
    │   └── providers/     # Providers globais
    ├── assets/            # Recursos estáticos importados no código
    ├── components/
    │   ├── branding/      # Logo e identidade visual
    │   ├── navigation/    # Navbar e navegação
    │   └── ui/            # Componentes de interface reutilizáveis
    ├── hooks/             # Hooks compartilhados
    ├── layouts/           # Layouts de página
    ├── pages/             # Páginas da aplicação
    ├── services/          # Serviços HTTP compartilhados
    ├── types/             # Tipos compartilhados
    ├── index.css          # Estilos globais e Tailwind
    └── main.tsx           # Ponto de entrada
```

As pastas de cada funcionalidade em `src/features/` são criadas conforme as respectivas Issues forem desenvolvidas, seguindo este padrão:

```text
features/
└── nome-da-feature/
    ├── components/
    ├── hooks/
    ├── services/    # quando houver chamadas HTTP
    ├── schemas/     # quando houver validações com Zod
    └── types/
```

## Convenções

- Componentes em TypeScript, pequenos e com responsabilidade única.
- Estilização com Tailwind CSS.
- Rotas com React Router, importando sempre de `react-router`.
- Sem duplicação de código e sem funcionalidades fora do wireframe ou das Issues.

### Branches e commits

- Cada Issue tem sua branch, criada a partir da `develop`, no formato `tipo/numero-da-issue/descricao-curta`. Exemplo: `feature/15/navbar`.
- Commits no formato `tipo: descrição curta` ou `tipo(escopo): descrição curta`. Exemplo: `feat(frontend): implementar navbar`.
- Nunca faça push direto na `main` nem na `develop`. Todo código entra por Pull Request, com Squash and merge.

## Build

```bash
npm run build
```

O build deve concluir sem erros antes de abrir qualquer Pull Request.