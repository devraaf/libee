# Guia de contribuição

Este guia define como o grupo trabalha no Libee: das tarefas ao merge. O objetivo é manter o desenvolvimento organizado sem criar burocracia.

Fluxo: **Issue → Branch → Desenvolvimento → Pull Request → Revisão → Squash Merge**

## 1. Issues

- Todo trabalho parte de uma Issue. Não há alteração sem Issue.
- Use um dos templates: **Funcionalidade (User Story)**, **Bug** ou **Tarefa técnica**.
- Funcionalidades são escritas como User Story, com critérios de aceite.
- Título no padrão `tipo(escopo): descrição`, por exemplo `chore(backend): inicializar backend com Spring Initializr`.
- Escopos em uso: `backend`, `frontend`, `database`, `github` e `workflow`.
- Labels: uma de **tipo** (`type: ...`), uma de **área** (`area: ...`, quando houver) e uma de **prioridade**. O template de Funcionalidade e o de Bug já aplicam a label de tipo.
- Ao começar uma tarefa, atribua a Issue a você (campo *Assignees*).
- Quando a tarefa fizer parte de uma entrega, associe o *Milestone*.

## 2. Branches

- `main`: versão estável do projeto.
- `develop`: onde as tarefas são integradas. É a branch padrão.
- **Nunca faça push direto na `main` nem na `develop`.**
- Cada Issue tem a sua branch, criada a partir da `develop`, no formato `tipo/numero-da-issue/descricao-curta`. Exemplo: `feature/15/cadastrar-livro`.

| Tipo de branch | Tipo de commit | Uso |
|---|---|---|
| `feature` | `feat` | Nova funcionalidade |
| `fix` | `fix` | Correção de bug |
| `docs` | `docs` | Documentação |
| `test` | `test` | Testes |
| `refactor` | `refactor` | Refatoração sem mudar comportamento |
| `chore` | `chore` | Configurações e tarefas auxiliares |

Antes de criar a branch, atualize a `develop`: `git checkout develop` e `git pull`.

## 3. Commits

Formato: `tipo: descrição curta` ou `tipo(escopo): descrição curta`.

Exemplos:

- `feat: implementar cadastro de livro`
- `fix(exemplar): corrigir controle de disponibilidade`
- `docs: atualizar requisitos funcionais`

Os commits intermediários da sua branch podem ser livres, porque serão agrupados no Squash Merge. O que importa é o título do PR.

## 4. Pull Requests

- O PR é aberto para a `develop`, com uma Issue por PR.
- Título no padrão `tipo(escopo): descrição (#issue)`, por exemplo `feat(backend): implementar cadastro de livro (#15)`. Ele vira o commit da `develop`.
- Preencha o template do PR: **O que foi feito**, **Como testar** e `Closes #N`.
- Mantenha o PR pequeno e focado na Issue.

## 5. Revisão

- Todo PR precisa da aprovação de **outra integrante** antes do merge. Ninguém aprova o próprio PR.
- A revisão não precisa ser formal. Confira:
  - se a implementação atende à Issue e aos critérios de aceite;
  - se o código funciona;
  - se há algum problema evidente;
  - se não há credenciais, tokens ou senhas no código.
- Depois da aprovação, quem abriu o PR ou o revisor faz o merge.

## 6. Merge

- O único método de merge é **Squash and merge**.
- O título do commit é o título do PR.
- A branch da tarefa é apagada automaticamente depois do merge.

## 7. Código e idiomas

- Código, variáveis, pacotes e nomes de arquivos em inglês.
- Issues, commits, PRs e documentação em português.

## 8. Segurança

- Nunca inclua credenciais, tokens ou senhas no repositório.
- Configurações locais e segredos ficam em variáveis de ambiente ou em arquivos ignorados pelo Git.

## 9. Banco de dados

- As migrations ficam em `backend/src/main/resources/db/migration`, no formato `V<número>__<descricao_em_ingles>.sql`.
- Uma migration que já foi integrada à `develop` **não é editada**: correções entram em uma nova versão.

