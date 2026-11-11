# Libee Frontend

Interface web do **Libee**, sistema de gestão de biblioteca acadêmica desenvolvido inicialmente para a biblioteca da Fatec Cotia.

O front-end segue o wireframe do projeto. Login, acervo, detalhes dos livros e empréstimos do leitor usam a API do back-end; outras telas ainda podem usar dados locais fictícios.

## Tecnologias

- [React](https://react.dev/) com TypeScript
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/) para navegação
- [Axios](https://axios-http.com/) para chamadas ao back-end
- [Zod](https://zod.dev/) para validação de formulários
- [Lucide React](https://lucide.dev/) para ícones
- [Vitest](https://vitest.dev/) e Testing Library para testes

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
| `npm test`             | Executa os testes do frontend                             |
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
    ├── features/               # Funcionalidades e testes em pastas __tests__ ou junto ao código
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

Testes específicos de uma feature ou componente devem ficar em pastas próprias próximas ao código testado. Use `src/test/` apenas para configurações, fixtures e utilitários compartilhados entre testes.

## Rotas e layouts

As rotas da aplicação ficam em `src/app/routes/AppRoutes.tsx`. O `AuthProvider`
inicializa a sessão pelo `session-storage` e expõe `session`, `login` e `logout`
por `useAuth()`. O `ProtectedRoute` exige sessão e, quando informado, valida o
perfil; visitantes são enviados para `/entrar` com o destino original salvo, e
um perfil sem permissão é redirecionado para a própria home. Use
`PublicOnlyRoute` em login e cadastro: se a sessão já existir, ele redireciona
para a home correspondente ao perfil. O mapa `homePathByProfile` centraliza os
destinos de leitor, bibliotecário e administrador.

O botão **Sair** do cabeçalho encerra a sessão no frontend: remove o token do
storage, atualiza o estado de autenticação e volta para `/entrar`. O backend não
revoga o token.

Após o autocadastro, o frontend autentica o leitor com as credenciais recém
cadastradas e o encaminha para a home correspondente ao perfil retornado.

A página institucional e a galeria são públicas. Acervo e empréstimos exigem o perfil leitor; o detalhe do livro pode ser aberto por leitor e bibliotecário. As rotas de gerenciamento exigem
bibliotecário. Login e cadastro usam o layout de autenticação próprio, e a
página 404 é exibida para caminhos desconhecidos. **Enquanto a home do
administrador (`/administracao/leitores`) não existe, o login de um
administrador leva à página “Página não encontrada” (404).** O fallback impede
que esse destino planejado gere um loop de redirecionamento.

Os testes de guards usam uma árvore de rotas isolada, não o `AppRoutes` real;
por isso, a associação de cada rota aos perfis permitidos também deve ser
conferida ao alterar `AppRoutes`. Quando a página de administrador for criada,
atualize o cenário correspondente em `src/app/routes/guards.test.tsx` para
montar essa rota e verificar a home real, em vez da 404.

Configure `VITE_API_BASE_URL` no ambiente local para apontar ao backend. Os testes unitários isolam a camada HTTP, mas a aplicação em execução usa os endpoints acima.

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
