-- ==========================================================================================================
-- Criação da tabela de auditoria(responsavel por armazenar os dados novos e antigos de update e delete)
-- ==========================================================================================================
CREATE TABLE audit_logs
(
    id         SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    operation  VARCHAR(10) NOT NULL, -- 'UPDATE' ou 'DELETE'
    record_id  INTEGER     NOT NULL,
    old_data   JSONB,
    new_data   JSONB,
    changed_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(100) DEFAULT current_user
);

-- ==========================================================================================================
-- Criação da função que retorna como um trigger (verifica qual é a operação e armazena os dados relevantes)
-- ==========================================================================================================

CREATE
OR REPLACE FUNCTION fn_generic_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF
(TG_OP = 'UPDATE') THEN                                      -- TG_OP = Variavel que armazena a operação nesse caso UPDATE
        INSERT INTO audit_logs (table_name, operation, record_id, old_data, new_data)
        VALUES (
            TG_TABLE_NAME,
            'UPDATE',
            NEW.id,
            to_jsonb(OLD),    -- JSONB - converte para JSON para comparação de dados
            to_jsonb(NEW)
        );
RETURN NEW;
ELSIF
(TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (table_name, operation, record_id, old_data, new_data)
        VALUES (
            TG_TABLE_NAME,
            'DELETE',
            OLD.id,
            to_jsonb(OLD),
            NULL
        );
RETURN OLD;
END IF;
RETURN NULL;
END;
$$
LANGUAGE plpgsql;


-- ====================================================================================
-- Criação das Triggers
-- ====================================================================================

CREATE TRIGGER trg_audit_users
    AFTER UPDATE OR
DELETE
ON users
FOR EACH ROW
EXECUTE FUNCTION fn_generic_audit();

CREATE TRIGGER trg_audit_books
    AFTER UPDATE OR
DELETE
ON books
FOR EACH ROW
EXECUTE FUNCTION fn_generic_audit();

CREATE TRIGGER trg_audit_book_copies
    AFTER UPDATE OR
DELETE
ON book_copies
FOR EACH ROW
EXECUTE FUNCTION fn_generic_audit();

CREATE TRIGGER trg_audit_loans
    AFTER UPDATE OR
DELETE
ON loans
FOR EACH ROW
EXECUTE FUNCTION fn_generic_audit();


SELECT *
FROM audit_logs;
