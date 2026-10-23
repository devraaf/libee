-- =================================================================
-- Scripts de testes tabela auditoria
-- =================================================================

-- 1. TESTE NA TABELA 'users' (Alteração e Exclusão)
-- Atualizando o e-mail da usuária Beatriz Carvalho (id 1)
UPDATE users
SET email = 'beatriz.nova.conta@example.com'
WHERE id = 1;

-- Excluindo o usuário de teste Isabela Freitas (id 8)
DELETE FROM users
WHERE id = 1;


-- 2. TESTE NA TABELA 'books' (Alteração de Título)
-- Atualizando o título do livro 1
UPDATE books
SET title = 'Engenharia de Software Moderna e Ágil'
WHERE id = 1;


-- 3. TESTE NA TABELA 'book_copies' (Alteração de Tombo)
-- Atualizando o número de tombamento do exemplar 1
UPDATE book_copies
SET accession_number = '9999-TOMBO'
WHERE id = 1;


-- 4. TESTE NA TABELA 'loans' (Renovação / Alteração de Prazo)
-- Simulando a renovação do empréstimo 4 (estendendo o prazo e somando contagem de renovação)
UPDATE loans
SET due_date = due_date + INTERVAL '14 days',
    renewal_count = renewal_count + 1
WHERE id = 4 AND return_date IS NULL;


-- =================================================================
-- Consultas para verificar os logs gerados
-- =================================================================

SELECT
    record_id AS usuario_id,
    operation,
    old_data->>'name' AS nome,
    old_data->>'email' AS email_antigo,
    new_data->>'email' AS email_novo,
    changed_at
FROM audit_logs
WHERE table_name = 'users';

-- Verificar alterações na tabela BOOKS (Mostra alteração de título)
SELECT
    record_id AS livro_id,
    operation,
    old_data->>'title' AS titulo_antigo,
    new_data->>'title' AS titulo_novo,
    changed_at
FROM audit_logs
WHERE table_name = 'books';

-- Verificar alterações na tabela BOOK_COPIES (Mostra alteração de tombo)
SELECT
    record_id AS exemplar_id,
    operation,
    old_data->>'accession_number' AS tombo_antigo,
    new_data->>'accession_number' AS tombo_novo,
    changed_at
FROM audit_logs
WHERE table_name = 'book_copies';

-- Verificar alterações na tabela LOANS (Mostra alteração de prazo de devolução e renovações)
SELECT
    record_id AS emprestimo_id,
    operation,
    old_data->>'due_date' AS vencimento_antigo,
    new_data->>'due_date' AS vencimento_novo,
    old_data->>'renewal_count' AS renovacoes_antigas,
    new_data->>'renewal_count' AS renovacoes_novas,
    changed_at
FROM audit_logs
WHERE table_name = 'loans';