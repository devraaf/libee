# Dados de teste

| Formato | Arquivo | Para quê |
|---|---|---|
| SQL | `V2__insert_test_data.sql` | Popular o banco de dados |
| JSON | arquivos em `test-data`| Mostrar os dados no formato em que a API vai recebê-los e devolvê-los |

Nenhum dado é real: nomes, e-mails, telefones, livros e autores são inventados.

## Como os JSON se relacionam com o banco

O banco guarda **linhas**, e o JSON é o formato em que os dados **trafegam pela API**. Quem converte um no outro é o backend:

```
JSON  →  API (Controller → Service → Repository)  →  linha no banco
JSON  ←  API                                      ←  linha no banco
```

| Arquivo | Tabela | Registros |
|---|---|---|
| `courses.json` | `courses` | 3 |
| `users.json` | `users` | 8 |
| `students.json` | `students` | 3 |
| `authors.json` | `authors` | 6 |
| `categories.json` | `categories` | 4 |
| `books.json` | `books` e `book_author` | 8 |
| `copies.json` | `book_copies` | 14 |
| `loans.json` | `loans` | 8 |

## Convenções

- Datas no formato: `yyyy-MM-dd`.
- Relações entre registros por id (`categoryId`, `copyId`, `readerId`...), como no banco.
- A relação entre livros e autores aparece em `books.json` como `authorIds` (no banco, é a tabela `book_author`).

## Senha de teste

Todos os usuários fictícios usam a senha `Libee@2026`. É um valor de teste, sem relação com nenhuma senha real.

- No **JSON** (`users.json`), o campo `password` traz essa senha em texto, porque é o que a API recebe no cadastro.
- No **banco**, a coluna `password_hash` guarda apenas o hash BCrypt dela. A senha nunca é armazenada em texto.

## Status do empréstimo

O status de um empréstimo **não é armazenado**: é calculado a partir das datas pela view `vw_loans`.

| Situação | Status |
|---|---|
| Tem `returnDate` | `RETURNED` |
| Sem `returnDate` e hoje depois de `dueDate` | `OVERDUE` |
| Sem `returnDate` e hoje até `dueDate` | `ON_TIME` |

Por isso `loans.json` não tem o campo `status`: ele só existe na resposta da API.

Cenários cobertos pelos 8 empréstimos de exemplo:

| Empréstimo | Cenário |
|---|---|
| 1 | Devolvido no prazo |
| 2 | Devolvido com atraso, com 1 renovação |
| 3 | Devolvido, com 2 renovações |
| 4 e 5 | Em andamento, em dia (data prevista distante, para continuarem em dia durante os testes) |
| 6 e 7 | Em andamento, atrasados |
| 8 | Devolvido; o mesmo exemplar (2) tem depois o empréstimo ativo 4 |