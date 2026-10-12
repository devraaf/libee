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

| Pacote | Responsabilidade |
|---|---|
| `controller` | Endpoints da API REST |
| `service` | Regras de negócio |
| `repository` | Acesso ao banco de dados |
| `entity` | Entidades |