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