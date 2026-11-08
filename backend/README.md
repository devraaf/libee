# Backend

API REST e regras de negócio do Libee.

## Tecnologias

- Java 25;
- Spring Boot (Web, Security, Data JPA);
- Flyway; 
- Lombok; 
- PostgreSQL;
- Maven.

## Pré-requisitos

- JDK 25;
- PostgreSQL (versão usada no desenvolvimento: 18);
- Um banco chamado `libee` criado localmente.

## Configuração

1. Crie o banco: `CREATE DATABASE libee;`
2. Copie `src/main/resources/application-local.properties.example` para `src/main/resources/application-local.properties` e informe seu usuário e sua senha do PostgreSQL.

O `application-local.properties` é ignorado pelo Git. **Nunca o envie para o repositório.**

## Como executar

Dentro da pasta `backend/`:

```bash
# Git Bash, Linux e macOS
./mvnw spring-boot:run     

# Prompt de Comando do Windows
mvnw.cmd spring-boot:run    
```

Enquanto a autenticação não for configurada, o Spring Security protege todas as rotas com um login gerado a cada inicialização.

## Estrutura de pacotes

Arquitetura em camadas, em `br.edu.fatec.libee.backend`:

| Pacote       | Responsabilidade         |
|--------------|--------------------------|
| `controller` | Endpoints da API REST    |
| `service`    | Regras de negócio        |
| `repository` | Acesso ao banco de dados |
| `entity`     | Entidades                |
| `exception`  | Exceções personalizadas  |
| `handler`    | Manipuladores            |

## Formato de erros da API

Os erros da API seguem o padrão **Problem Details** ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)).
A resposta tem o `Content-Type` `application/problem+json` e esta estrutura:

| Campo | Descrição |
|---|---|
| `status` | Código HTTP do erro |
| `title` | Resumo curto do tipo de erro |
| `detail` | Explicação do erro, em português |
| `timestamp` | Data e hora do erro |
| `traceId` | Identificador do erro, presente **apenas nos erros 500**. Permite achar o erro no log do servidor |

Outros campos padrão da RFC, como `type` e `instance`, também podem aparecer.

### Códigos de status

| Status | Quando ocorre |
|---|---|
| 400 | Parâmetro inválido (ex.: `size` fora do limite, `categoryId` não numérico) ou corpo da requisição ilegível |
| 401 | Requisição sem autenticação ou com autenticação inválida |
| 403 | Usuário autenticado sem permissão para o recurso |
| 404 | Recurso solicitado não existe, ou rota inexistente |
| 405 | Método HTTP não suportado pela rota |
| 422 | Requisição válida, mas viola uma regra de negócio (ex.: exemplar já emprestado) |
| 500 | Erro inesperado no servidor |

### Para o cliente da API

- Decida o que mostrar pelo `status`, não pelo texto do `title`.
- Nos erros 4xx, o `detail` é seguro para exibir ao usuário. No 500, exiba uma mensagem genérica.
- Ao reportar um erro 500, informe o `traceId`: com ele o erro é localizado no log do servidor.

### Para quem desenvolve

Para devolver um erro de negócio, lance uma das exceções do pacote `exception`; o `GlobalExceptionHandler` converte para a resposta acima:

```java
throw new ResourceNotFoundException("Livro não encontrado: id " + id);   // 404
throw new BusinessRuleException("O exemplar já está emprestado.");       // 422
```

A mensagem dessas exceções é enviada ao cliente. Não inclua nela dados internos nem dados pessoais.

### Observação

Os erros 401 e 403 gerados pelos filtros do Spring Security (requisição sem login ou bloqueada por regra de URL) são produzidos antes de chegar aos controllers e **não** passam pelo `GlobalExceptionHandler`, então não seguem este formato.

## Configuração local

### Variáveis de ambiente
| Variável | Obrigatória | Descrição |
|---|---|---|
| `JWT_SECRET` | Sim | Segredo que assina os tokens JWT (HS256). Mínimo de 32 bytes. Gere com `openssl rand -base64 48`. Nunca commitar. |
| `CORS_ALLOWED_ORIGINS` | Não | Origens do front liberadas no CORS. Padrão: `http://localhost:5173`. |

Sem `JWT_SECRET`, a aplicação não sobe (comportamento intencional).

### IntelliJ
Run → Edit Configurations → `BackendApplication` → Modify options → Environment variables
→ `JWT_SECRET=<valor>` e, em Active profiles, `local`.

## Testes
### Como rodar
```bash
mvn test                              # suíte inteira (unitários e ITs)
mvn test -Dtest=BookControllerIT      # uma classe só
```
Os testes de integração (`*IT`) usam **Testcontainers**: o **Docker precisa estar em
execução**. Os testes usam o perfil `test` e não precisam das variáveis `JWT_SECRET` nem
do banco local. O segredo de teste está em `application-test.properties`.

### Estrutura
| Classe | Papel |
|---|---|
| `AbstractIntegrationTest` | Base de todo IT. Sobe o contexto do Spring com o perfil `test`, um **único** PostgreSQL de Testcontainers para a suíte inteira, e cada teste roda numa transação que sofre rollback no final. |
| `TestData` | Fábrica de dados de apoio (usuários, cursos, categorias, autores, livros, exemplares, alunos e empréstimos). |
| `RouteSecurityIT` | Matriz de rotas × perfis: confere 401 sem login e 403 para perfis sem permissão. |
| `*ControllerIT` | Um por controller. Testam só o comportamento da funcionalidade. |

### O que a classe base oferece
| Membro | Uso |
|---|---|
| `mockMvc` | Faz as requisições. |
| `jdbcTemplate` | Confere o banco por SQL quando necessário. |
| `testData` | Cria os dados de apoio. |
| `truncate("tabela", ...)` | Esvazia tabelas (com `CASCADE` e `RESTART IDENTITY`) para o teste não depender de dados pré-existentes. |
| `postJson(caminho, corpo)` | `POST` com corpo JSON. Aceita `.with(...)` e `.param(...)` depois. |
| `asReader(user)` / `asLibrarian(user)` | Simula uma requisição com um JWT daquele usuário (ver "Qual papel usar"). |

### TestData
| Método | Cria |
|---|---|
| `saveUser(email, perfil)` | Usuário com nome padrão e vínculo `EMPLOYEE`. |
| `saveUser(nome, email, telefone, vínculo, perfil)` | Usuário com todos os campos. |
| `saveStudent(usuário, curso)` | Registro de aluno. |
| `saveCourse(nome)`, `saveCategory(nome)`, `saveAuthor(nome)` | Curso, categoria, autor. |
| `saveBook(isbn, título, categoria, autores...)` | Livro. |
| `saveCopy(livro, tombo, status)` | Exemplar (localização `A-01`). Há uma versão com a localização. |
| `saveLoan(leitor, bibliotecário, vencimento, devolução)` | Empréstimo, com livro e exemplar criados automaticamente. |
| `saveLoan(exemplar, leitor, bibliotecário, empréstimo, vencimento, devolução, renovações)` | Empréstimo com todos os dados definidos pelo teste. |

Todos os usuários de teste usam a senha `TestData.PASSWORD`.

### Escrevendo um IT novo
```java
@WithMockUser(roles = "LIBRARIAN")                      // papel padrão da classe
public class ExemploControllerIT extends AbstractIntegrationTest {

    @BeforeEach
    void setUp() {
        truncate("students", "courses");                // tabelas que o teste usa
        testData.saveCourse("Logística");               // dados de apoio
    }

    @Test
    @DisplayName("Cadastra o exemplo e retorna 201 quando os dados são válidos")
    void createsExample_whenDataIsValid() throws Exception {
        mockMvc.perform(postJson("/exemplos", "{\"name\": \"Teste\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Teste"));
    }
}
```
- Nome do método: `returns..._when...` ou `creates..._when...`. O `@DisplayName` fica em português.
- Separe os grupos de testes por rota com um comentário `// TESTES DE GET /rota - descrição`.
- Não declare `@SpringBootTest`, `@Container`, `MockMvc` nem `JdbcTemplate`: vêm da base.

**Tabelas para o `truncate`, por área**

| Área | Tabelas |
|---|---|
| Acervo | `loans`, `book_copies`, `book_author`, `books`, `authors`, `categories` |
| Usuários | `loans`, `students`, `users` |
| Cursos | `students`, `courses` |

### Qual papel usar
- O papel padrão da classe vai em `@WithMockUser(roles = "...")`. Um teste que precisa de outro papel sobrescreve com a anotação no método.
- Se o endpoint lê o **id do usuário do token** (como `GET /loans` e `POST /loans`), use `.with(asReader(usuário))` ou `.with(asLibrarian(usuário))`. O `@WithMockUser` não carrega um JWT, e esses endpoints falham com 500 sem ele. O usuário precisa existir no banco (`testData.saveUser`).
- O **administrador não herda** as permissões do bibliotecário.

### Autorização
Os testes de **401 e 403 não ficam nos ITs de cada controller**. Quem os cobre é o `RouteSecurityIT`.
Ao criar uma rota nova, faça os dois passos:
1. Acrescente a regra no `SecurityConfig`.
2. Acrescente a linha da rota na tabela do `RouteSecurityIT`.

Se o caminho da regra não bater com a rota real, a rota cai em `authenticated()` e qualquer perfil acessa. O `RouteSecurityIT` existe para pegar esse erro.