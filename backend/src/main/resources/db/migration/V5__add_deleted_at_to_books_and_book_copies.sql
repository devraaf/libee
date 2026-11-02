-- Exclusão lógica: nulo = ativo; preenchido = data e hora da exclusão
ALTER TABLE books
    ADD COLUMN deleted_at timestamp with time zone;

ALTER TABLE book_copies
    ADD COLUMN deleted_at timestamp with time zone;