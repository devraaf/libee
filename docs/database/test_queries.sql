-- Listar livros com autores, categoria e quantidade de exemplares
SELECT
    b.id,
    b.title,
    b.isbn,
    c.name AS category,
    STRING_AGG(DISTINCT a.name, ', ') AS authors,
    COUNT(DISTINCT bc.id) AS total_copies,
    COUNT(DISTINCT bc.id)
        FILTER (WHERE bc.status = 'AVAILABLE') AS available_copies
FROM books b
JOIN categories c ON c.id = b.category_id
LEFT JOIN book_author ba ON ba.book_id = b.id
LEFT JOIN authors a ON a.id = ba.author_id
LEFT JOIN book_copies bc ON bc.book_id = b.id
GROUP BY b.id, b.title, b.isbn, c.name
ORDER BY b.title;

-- Listar exemplares disponíveis para empréstimos
SELECT
    bc.id AS copy_id,
    bc.accession_number,
    b.title,
    bc.physical_location,
    bc.status
FROM book_copies bc
JOIN books b ON b.id = bc.book_id
WHERE bc.status = 'AVAILABLE'
ORDER BY b.title, bc.accession_number;

-- Listar empréstimos ativos
SELECT
    l.id AS loan_id,
    reader.name AS reader,
    b.title AS book,
    bc.accession_number,
    l.loan_date,
    l.due_date,
    l.renewal_count,
    l.status
FROM vw_loans l
JOIN users reader ON reader.id = l.reader_id
JOIN book_copies bc ON bc.id = l.copy_id
JOIN books b ON b.id = bc.book_id
WHERE l.return_date IS NULL
ORDER BY l.due_date;

-- Listar empréstimos atrasados
SELECT
    l.id AS loan_id,
    reader.name AS reader,
    reader.email,
    b.title AS book,
    bc.accession_number,
    l.due_date,
    CURRENT_DATE - l.due_date AS days_overdue
FROM vw_loans l
JOIN users reader ON reader.id = l.reader_id
JOIN book_copies bc ON bc.id = l.copy_id
JOIN books b ON b.id = bc.book_id
WHERE l.status = 'OVERDUE'
ORDER BY l.due_date;

-- Lista geral do acervo e empréstimos
SELECT
    (SELECT COUNT(*) FROM books) AS total_books, -- total de livros
    (SELECT COUNT(*) FROM book_copies) AS total_copies, -- total de exemplares
    (SELECT COUNT(*)
     FROM book_copies
     WHERE status = 'AVAILABLE') AS available_copies, -- total de exemplares disponíveis 
    (SELECT COUNT(*)
     FROM book_copies
     WHERE status = 'ON_LOAN') AS copies_on_loan, -- exemplares em empréstimos
    (SELECT COUNT(*)
     FROM loans
     WHERE return_date IS NULL) AS active_loans, -- total empréstimos ativos (em dia ou não)
    (SELECT COUNT(*)
     FROM vw_loans
     WHERE status = 'OVERDUE') AS overdue_loans, -- total empréstimos atrasados
    (SELECT COUNT(*)
     FROM loans
     WHERE return_date IS NOT NULL) AS returned_loans; -- total empréstimos delvolvidos (finalizados/não ativos)