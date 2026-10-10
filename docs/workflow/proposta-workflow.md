# Proposta de Workflow e Padrões de Desenvolvimento — Libee

## 1. O que queremos resolver?

Conforme começarmos a implementação, teremos várias pessoas trabalhando simultaneamente em diferentes partes do sistema.

Sem uma organização definida, podemos acabar tendo situações como:

- várias pessoas alterando a mesma branch;
- dificuldade para saber quem está trabalhando em determinada funcionalidade;
- alterações entrando no código sem revisão;
- dificuldade para identificar qual tarefa originou determinada alteração;
- histórico do Git com muitos commits pouco descritivos;
- dificuldade para acompanhar o progresso geral do desenvolvimento.

A proposta é utilizar o próprio GitHub para organizar esse processo.

---

## 2. Fluxo proposto

A ideia é que cada tarefa passe por um fluxo semelhante a:

**Issue → Branch → Desenvolvimento → Pull Request → Revisão → Merge**

### 2.1 Issue

Cada funcionalidade ou tarefa de desenvolvimento pode ser representada por uma **Issue**.

Podemos utilizar o formato de **User Story** quando fizer sentido, além de incluir critérios de aceite para deixar claro quando a tarefa pode ser considerada concluída.

Exemplo:

> **#15 — Cadastrar livro**
>
> Como bibliotecário, quero cadastrar um livro no sistema para que ele possa fazer parte do acervo.
>
> **Critérios de aceite:**
> - permitir informar os dados necessários do livro;
> - validar os campos obrigatórios;
> - persistir o livro no banco de dados.

Além de documentar a tarefa, a Issue também pode ser utilizada no **GitHub Projects**, permitindo acompanhar o andamento pelo quadro Kanban.

---

## 3. Branches

Depois de assumir uma Issue, a pessoa responsável cria uma branch temporária própria para desenvolver aquela tarefa.

As branches de desenvolvimento partiriam da `develop`.

A proposta de nomenclatura seria:

```text
tipo/numero-da-issue/descricao-curta
```

Por exemplo:

```text
feature/15/cadastrar-livro
```

Dessa forma, conseguimos relacionar:

**Issue #15 → Branch → Pull Request → implementação**

Alguns tipos que podemos utilizar:

| Tipo | Utilização |
|---|---|
| `feature` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `test` | Testes |
| `refactor` | Refatoração |
| `chore` | Configurações e tarefas auxiliares |

---

## 4. Commits

Para manter o histórico mais organizado, podemos utilizar uma versão simplificada do **Conventional Commits**.

Formato:

```text
tipo: descrição curta
```

Exemplos:

```text
feat: implementar cadastro de livro
fix: corrigir validacao do emprestimo
test: adicionar testes do emprestimo
docs: atualizar requisitos funcionais
refactor: reorganizar serviço de emprestimo
```

Também podemos utilizar um escopo quando ajudar a deixar o commit mais específico:

```text
feat(emprestimo): registrar novo emprestimo
fix(exemplar): corrigir controle de disponibilidade
```

A ideia não é tornar cada commit burocrático, mas fazer com que, ao olhar o histórico posteriormente, seja possível entender o que foi alterado.

---

## 5. Pull Requests

Quando a tarefa estiver concluída, a pessoa responsável abre um **Pull Request para a `develop`**.

O PR seria utilizado para:

- explicar o que foi implementado;
- indicar a Issue relacionada;
- informar como testar, quando necessário;
- permitir que outra integrante revise a alteração antes do merge.

Por exemplo:

```md
feat: implementar cadastro de livro (#15)
```

No corpo do PR podemos ter algo simples como:

```md
## O que foi feito

- Implementado cadastro de livro
- Adicionadas validações dos campos obrigatórios
- Criada persistência no banco

## Como testar

1. Executar a aplicação
2. Acessar a funcionalidade de cadastro
3. Informar os dados do livro
4. Verificar a persistência

Closes #15
```

---

## 6. Revisão

Antes de integrar o código à `develop`, outra integrante do grupo revisaria o Pull Request.

A revisão não precisa ser algo extremamente formal. O objetivo é termos uma segunda pessoa verificando, por exemplo:

- se a implementação atende à tarefa;
- se o código está funcionando;
- se existe algum problema evidente;
- se os critérios de aceite foram atendidos.

Depois da aprovação, o PR pode ser integrado.

---

## 7. Squash Merge

Como cada pessoa pode fazer vários commits durante o desenvolvimento de uma tarefa, podemos utilizar **Squash Merge** ao integrar o Pull Request.

Por exemplo, durante o desenvolvimento poderiam existir:

```text
feat: criar entidade livro
fix: corrigir entidade livro
fix: corrigir validacao
test: testar cadastro
ajuste
corrigir erro
```

Em vez de todos esses commits ficarem no histórico da `develop`, o Squash Merge permite que eles sejam agrupados em uma única alteração relacionada à tarefa.

Assim, o histórico da `develop` pode ficar mais organizado e representa melhor as entregas do projeto.

---

## 8. Organização das branches principais

A proposta seria trabalhar inicialmente com duas branches principais:

```text
main
  │
  └── develop
       │
       ├── feature/15/cadastrar-livro
       ├── feature/18/registrar-emprestimo
       └── fix/22/corrigir-disponibilidade
```

### `main`

Representa uma versão estável do projeto.

### `develop`

É onde as implementações das diferentes tarefas são integradas durante o desenvolvimento.

### Branch de tarefa

É criada individualmente para cada Issue e depois integrada à `develop` através de um Pull Request.

---

## 9. Benefícios esperados

A principal intenção desse workflow é **organizar o desenvolvimento sem criar burocracia desnecessária**.

Entre os benefícios esperados:

**Organização**  
Cada pessoa consegue identificar claramente a tarefa que está desenvolvendo.

**Rastreabilidade**  
Podemos relacionar uma implementação à Issue, à branch e ao Pull Request correspondente.

**Menos conflitos**  
Cada integrante trabalha em sua própria branch em vez de alterar diretamente uma branch compartilhada.

**Revisão de código**  
As alterações passam por uma segunda pessoa antes de serem integradas à `develop`.

**Histórico mais compreensível**  
Os commits seguem um padrão e o Squash Merge evita acumular commits intermediários na branch de desenvolvimento.

**Acompanhamento do projeto**  
As Issues podem ser utilizadas junto ao GitHub Projects para acompanhar as tarefas em um quadro Kanban.

**Experiência prática**  
Além de ajudar na organização durante o desenvolvimento do Libee, teremos contato com um fluxo de desenvolvimento semelhante ao encontrado em projetos reais.

---

## 10. Fluxo resumido

```text
┌──────────────┐
│    ISSUE     │
│  #15 Criar   │
│    livro     │
└──────┬───────┘
       ↓
┌──────────────┐
│    BRANCH    │
│ feature/15/  │
│ cadastrar... │
└──────┬───────┘
       ↓
┌──────────────┐
│ DESENVOLVER  │
│   + commits  │
│ padronizados │
└──────┬───────┘
       ↓
┌──────────────┐
│      PR      │
│   → develop  │
└──────┬───────┘
       ↓
┌──────────────┐
│   REVISÃO    │
│  por outra   │
│   integrante │
└──────┬───────┘
       ↓
┌──────────────┐
│ SQUASH MERGE │
│  → develop   │
└──────────────┘
```
