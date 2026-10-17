# Instruções para reproduzir o banco de dados do Libee

Este roteiro permite recriar o banco de dados e conferir os dados preparados para a Sprint Zero. Os dados são fictícios e destinados exclusivamente a desenvolvimento e testes.

## Entregáveis da atividade

- [diagrama-classes.png](../uml/diagrama-classes.png): diagrama de classes do Libee.
- [V1__create_domains_and_tables.sql](../../backend/src/main/resources/db/migration/V1__create_domains_and_tables.sql): formatação do banco de dados.
- [V2__insert_test_data.sql](../../backend/src/main/resources/db/migration/V2__insert_test_data.sql): dados de teste inseridos no banco.
- Arquivos `.json` em [test-data/](../test-data/): representação dos dados no formato previsto para tráfego pela API.
- [test_queries.sql](./test_queries.sql): consultas para conferir o acervo e os empréstimos.

## Pré-requisitos

- PostgreSQL 18 instalado e em execução.
- Acesso ao PostgreSQL com permissão para criar bancos de dados.
- pgAdmin.

## Reprodução pelo pgAdmin

1. Conecte-se ao servidor PostgreSQL e crie um banco chamado `libee_sprint0`.
2. Abra o Query Tool desse banco.
3. Abra e execute `V1__create_domains_and_tables.sql`.
4. Sem trocar de banco, abra e execute `V2__insert_test_data.sql`.
5. Para conferir os resultados, abra e execute `test_queries.sql`.

Execute os dois primeiros arquivos SQL uma única vez e na ordem indicada, em um banco recém-criado. A estrutura e os dados usam nomes e IDs fixos, então não execute esses scripts novamente sobre o mesmo banco. Para recomeçar, crie outro banco vazio para a avaliação. O arquivo `test_queries.sql` contém apenas consultas de leitura e pode ser executado novamente.

## Conferência dos resultados

Após a carga, o banco deve conter:

| Tabela | Quantidade esperada |
|---|---:|
| `courses` | 3 |
| `users` | 8 |
| `students` | 3 |
| `authors` | 6 |
| `categories` | 4 |
| `books` | 8 |
| `book_author` | 9 |
| `book_copies` | 14 |
| `loans` | 8 |

As consultas em `test_queries.sql` demonstram listagens do acervo, exemplares disponíveis, empréstimos ativos, empréstimos atrasados e um resumo das quantidades.

O status dos empréstimos é calculado pela view `vw_loans` com base na data em que a consulta é executada: `RETURNED` quando há devolução, `OVERDUE` quando a data prevista já passou e `ON_TIME` nos demais empréstimos ativos. Portanto, o resultado dos status pode mudar com o passar do tempo.

## Sobre os arquivos JSON

Os JSONs documentam os formatos de dados planejados para a API; não são scripts para importar diretamente no PostgreSQL. A carga reproduzível do banco é feita pelo arquivo SQL de dados. A relação entre livros e autores, por exemplo, aparece como `authorIds` no JSON e é persistida na tabela `book_author`.

Mais detalhes sobre os arquivos, relacionamentos e cenários dos empréstimos estão em [test-data/README.md](../test-data/README.md).
