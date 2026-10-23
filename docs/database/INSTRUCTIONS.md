# Instruções para configurar e reproduzir o banco de dados do Libee

Este documento descreve como configurar o ambiente local do banco de dados do Libee, iniciar os serviços necessários e reproduzir a estrutura do banco por meio das migrations do Flyway.

O ambiente utiliza PostgreSQL executado em container Docker. Os dados são persistidos em um volume nomeado, permitindo que os containers sejam parados e iniciados novamente sem perder o banco.

## 1. Pré-requisitos

Antes de começar, instale ou tenha disponível:

- [Git](https://git-scm.com/);
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), em execução;

O pgAdmin é disponibilizado por meio do Docker Compose, portanto não é necessário instalá-lo separadamente.

## 2. Configuração do ambiente

Na raiz do repositório, copie o arquivo `.env.example` para `.env`.

No Git Bash, execute:

```bash
cp .env.example .env
```

No Windows PowerShell, execute:

```powershell
Copy-Item .env.example .env
```

Abra o arquivo `.env` e defina as credenciais locais para o PostgreSQL e o pgAdmin.

O arquivo `.env` contém configurações privadas do ambiente local e não deve ser versionado. Utilize o `.env.example` como referência para compartilhar os nomes das variáveis necessárias, sem incluir senhas reais.

## 3. Inicialização dos serviços

Na raiz do repositório, execute:

```bash
docker compose up -d
```

O comando inicia os seguintes serviços:

| Serviço | Finalidade |
|---|---|
| `db` | Banco de dados PostgreSQL |
| `pgadmin` | Interface gráfica para administrar o banco |

Para verificar o estado dos containers:

```bash
docker compose ps
```

O serviço `db` deve apresentar o estado `healthy` antes de o backend tentar se conectar ao banco.

## 4. Acesso ao banco de dados

### 4.1 PostgreSQL

A configuração local utiliza as seguintes informações:

| Parâmetro | Valor |
|---|---|
| Host | `localhost` |
| Porta | `5433` |
| Banco de dados | `libee` |
| Usuário | Definido em `.env` |
| Senha | Definida em `.env` |

A porta `5433` do computador é direcionada à porta `5432` do container PostgreSQL.

### 4.2 pgAdmin

Acesse o pgAdmin pelo navegador:

<http://localhost:5050>

Entre com as credenciais definidas pelas variáveis `PGADMIN_EMAIL` e `PGADMIN_PASSWORD` no arquivo `.env`.

Caso seja necessário cadastrar uma conexão com o PostgreSQL dentro do pgAdmin, utilize:

| Parâmetro | Valor |
|---|---|
| Nome da conexão | `Libee Local` |
| Host | `db` |
| Porta | `5432` |
| Banco de dados | `libee` |
| Usuário | Definido em `.env` |
| Senha | Definida em `.env` |

Dentro da rede Docker Compose, o hostname `db` identifica o container PostgreSQL. Por isso, essa conexão utiliza a porta interna `5432`, enquanto aplicações executadas diretamente no computador utilizam `localhost:5433`.

## 5. Execução do backend e migrations

Com o PostgreSQL em execução, inicie o backend conforme as instruções do projeto.

A configuração local do Spring Boot utiliza o banco `libee` por meio da URL:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5433/libee
```

Ao iniciar o backend, o Flyway identifica e executa as migrations disponíveis em:

`backend/src/main/resources/db/migration/`

As migrations são aplicadas na ordem de versão e registradas na tabela `flyway_schema_history`.

Não execute manualmente os arquivos de migration que o Flyway já aplicou. Para conferir o histórico, consulte a tabela `flyway_schema_history` no banco de dados.

Se uma migration falhar, verifique os logs do backend e corrija a causa antes de prosseguir. Não altere migrations já aplicadas sem avaliar o impacto no histórico e nos ambientes dos demais integrantes.

## 6. Persistência e encerramento do ambiente

Para parar os containers:

```bash
docker compose down
```

Esse comando remove os containers e a rede do projeto, mas preserva os volumes nomeados. Ao executar novamente `docker compose up -d`, os dados existentes devem continuar disponíveis.

**Atenção:** não utilize `docker compose down -v` para encerrar o ambiente normalmente. A opção `-v` remove os volumes nomeados e pode apagar permanentemente os dados locais do banco e do pgAdmin.

O banco é inicializado com a configuração e os dados definidos pelas migrations aplicadas. Se o volume for removido e o banco for recriado, o Flyway executará novamente as migrations sobre o banco vazio.

## 7. Comandos úteis

Validar a configuração do Docker Compose:

```bash
docker compose config --quiet
```

Verificar os containers:

```bash
docker compose ps
```

Consultar os logs do PostgreSQL:

```bash
docker compose logs db
```

Consultar os logs do pgAdmin:

```bash
docker compose logs pgadmin
```

Acompanhar os logs do backend e verificar a execução das migrations durante sua inicialização.

## 8. Arquivos da atividade Sprint Zero

Os arquivos da atividade original continuam disponíveis no repositório:

- [Diagrama de classes](../uml/diagrama-classes.png)
- [Migration de estrutura da Sprint Zero](../../backend/src/main/resources/db/migration/V1__create_domains_and_tables.sql)
- [Migration de dados de teste da Sprint Zero](../../backend/src/main/resources/db/migration/V2__insert_test_data.sql)
- [Consultas de conferência](./test_queries.sql)
- [Dados de teste em JSON](../test-data/)
- [Documentação dos dados de teste](../test-data/README.md)

Esses arquivos documentam a modelagem e os cenários preparados para a Sprint Zero. Para o desenvolvimento cotidiano, a criação e a atualização do esquema devem seguir o fluxo de migrations do Flyway.

As consultas de `test_queries.sql` podem ser utilizadas para conferir os dados quando o banco contiver os registros esperados por elas. A disponibilidade desses registros depende das migrations presentes e aplicadas no ambiente atual.

## 9. Solução de problemas

### O backend não consegue se conectar ao PostgreSQL

- Verifique se o Docker Desktop está em execução.
- Execute `docker compose ps` e confirme que o serviço `db` está saudável.
- Confirme se a URL do backend utiliza `localhost:5433`.
- Confira se o banco, o usuário e a senha correspondem às variáveis definidas em `.env`.

### O pgAdmin não abre

- Verifique se o container `pgadmin` está em execução.
- Consulte os logs com `docker compose logs pgadmin`.
- Confirme se a porta `5050` está disponível no computador.

### As migrations não são executadas

- Verifique os logs do backend.
- Confira se o backend está conectado ao banco correto.
- Consulte `flyway_schema_history` para identificar as migrations registradas e seu estado de execução.
