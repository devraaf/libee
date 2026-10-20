-- Cursos
INSERT INTO courses (id, name) VALUES
   (1, 'Análise e Desenvolvimento de Sistemas'),
   (2, 'Gestão Empresarial'),
   (3, 'Logística');

-- Usuários
INSERT INTO users (id, name, email, password_hash, phone, affiliation_type, profile) VALUES
    (1, 'Beatriz Carvalho', 'beatriz.carvalho@example.com', '$2a$10$.HVSVYDKxwyKlOGatN2IMeB.xPRyIMWQTTkfBE/Qe781L3A0GaK4O', '11912340001', 'EMPLOYEE', 'ADMINISTRATOR'),
    (2, 'Carlos Mendes', 'carlos.mendes@example.com', '$2a$10$VpqTaVb3f.eX2H0lRex9JuKoUr41Zc5hA42MQvBkwT1tpJ/Y.m4Oi', '11912340002', 'EMPLOYEE', 'LIBRARIAN'),
    (3, 'Daniela Prado', 'daniela.prado@example.com', '$2a$10$KOcGYrGbhEcu02qMnoupAOoW.Lx9Z1cyPck9MlnSWeJQ9CnX618OW', '1133340003', 'EMPLOYEE', 'LIBRARIAN'),
    (4, 'Eduardo Lima', 'eduardo.lima@example.com', '$2a$10$CULMCuvlDdgoiBUbvmGxtebqqVv2lCqBiJ6vtCtQe7hTy4zPoopQm', '11912340004', 'STUDENT', 'READER'),
    (5, 'Fernanda Rocha', 'fernanda.rocha@example.com', '$2a$10$0FqLpSqtURWOlssyEbGf0.PCIhmDhOZXvdlIV7KtYexjLEo8DYhDu', NULL, 'STUDENT', 'READER'),
    (6, 'Gabriel Teixeira', 'gabriel.teixeira@example.com', '$2a$10$E9AJDtaoS9nFpxOtVKBuPu2QHzGdqoU4hs/KlnOi8/YK9WB4Tsph.', '11912340006', 'STUDENT', 'READER'),
    (7, 'Henrique Azevedo', 'henrique.azevedo@example.com', '$2a$10$YZjujarx6sT66qIF8MobY.1otPz92jbPNFEWOuxw7YZLzOMWtLkkC', '1133340007', 'PROFESSOR', 'READER'),
    (8, 'Isabela Freitas', 'isabela.freitas@example.com', '$2a$10$v0eSDMhM/j3to4u6ajdNAOhe66J50ZnqtOFtO8y47bPkTO00F0OD6', '11912340008', 'EMPLOYEE', 'READER');

-- Alunos (usuários com vínculo STUDENT)
INSERT INTO students (user_id, course_id) VALUES
   (4, 1),
   (5, 1),
   (6, 2);

-- Autores
INSERT INTO authors (id, name) VALUES
   (1, 'Helena Duarte'),
   (2, 'Rafael Monteiro'),
   (3, 'Clara Nogueira'),
   (4, 'Otávio Brandão'),
   (5, 'Marina Falcão'),
   (6, 'Gustavo Leitão');

-- Categorias
INSERT INTO categories (id, name) VALUES
   (1, 'Tecnologia'),
   (2, 'Ciências'),
   (3, 'Literatura'),
   (4, 'História');

-- Livros
INSERT INTO books (id, isbn, title, publisher, publication_place, edition, cover_image_url, publication_date, page_count, summary, category_id) VALUES
    (1, '9780000000019', 'Introdução à Engenharia de Software', 'Editora Exemplo', 'São Paulo', '3ª edição', 'https://example.com/covers/1.jpg', '2021-03-15', 412, 'Livro fictício sobre os fundamentos do desenvolvimento de software.', 1),
    (2, '9780000000026', 'Banco de Dados na Prática', 'Editora Exemplo', 'São Paulo', '2ª edição', 'https://example.com/covers/2.jpg', '2019-08-01', 358, 'Livro fictício sobre modelagem e consulta a bancos de dados relacionais.', 1),
    (3, '0123456789', 'Fundamentos de Física', 'Editora Modelo', 'Rio de Janeiro', '1ª edição', 'https://example.com/covers/3.jpg', '2003-05-20', 520, 'Livro fictício, com ISBN-10 de antes de 2007, sobre conceitos básicos de física.', 2),
    (4, '9780000000040', 'Química do Cotidiano', 'Editora Modelo', 'Campinas', '1ª edição', 'https://example.com/covers/4.jpg', '2018-11-10', 290, 'Livro fictício que relaciona a química a situações do dia a dia.', 2),
    (5, '9780000000057', 'Contos de uma Cidade Imaginária', 'Editora Exemplo', 'Belo Horizonte', '1ª edição', 'https://example.com/covers/5.jpg', '2020-02-14', 184, 'Coletânea fictícia de contos ambientados em uma cidade inventada.', 3),
    (6, '9780000000064', 'O Farol e a Névoa', 'Editora Modelo', 'Porto Alegre', '2ª edição', 'https://example.com/covers/6.jpg', '2015-09-30', 246, 'Romance fictício sobre uma comunidade costeira.', 3),
    (7, '9780000000071', 'História da Biblioteca Imaginária', 'Editora Exemplo', 'Curitiba', '1ª edição', 'https://example.com/covers/7.jpg', '2017-06-05', 332, 'Livro fictício sobre a história de uma biblioteca inventada.', 4),
    (8, '9780000000088', 'Linha do Tempo de um Século', 'Editora Modelo', 'Salvador', '1ª edição', 'https://example.com/covers/8.jpg', '2022-10-22', 400, 'Livro fictício que reúne acontecimentos de um século imaginário.', 4);

-- Autoria
INSERT INTO book_author (book_id, author_id) VALUES
    (1, 1),
    (2, 2),
    (2, 3),
    (3, 4),
    (4, 5),
    (5, 3),
    (6, 6),
    (7, 1),
    (8, 2);

-- Exemplares
INSERT INTO book_copies (id, book_id, accession_number, physical_location, status) VALUES
    (1, 1, '0001', 'Estante A-01', 'AVAILABLE'),
    (2, 1, '0002', 'Estante A-02', 'ON_LOAN'),
    (3, 2, '0003', 'Estante B-01', 'AVAILABLE'),
    (4, 2, '0004', 'Estante B-02', 'AVAILABLE'),
    (5, 3, '0005', 'Estante C-01', 'AVAILABLE'),
    (6, 3, '0006', 'Estante C-02', 'AVAILABLE'),
    (7, 4, '0007', 'Estante D-01', 'ON_LOAN'),
    (8, 4, '0008', 'Estante D-02', 'AVAILABLE'),
    (9, 5, '0009', 'Estante E-01', 'ON_LOAN'),
    (10, 5, '0010', 'Estante E-02', 'AVAILABLE'),
    (11, 6, '0011', 'Estante F-01', 'ON_LOAN'),
    (12, 7, '0012', 'Estante G-01', 'AVAILABLE'),
    (13, 7, '0013', 'Estante G-02', 'AVAILABLE'),
    (14, 8, '0014', 'Estante H-01', 'AVAILABLE');

-- Empréstimos: devolvidos no prazo e com atraso, em andamento em dia e em andamento atrasados.
INSERT INTO loans (id, copy_id, reader_id, librarian_id, loan_date, due_date, return_date, renewal_count) VALUES
    (1, 1, 4, 2, '2026-08-03', '2026-08-17', '2026-08-14', 0),
    (2, 3, 5, 3, '2026-08-10', '2026-08-24', '2026-09-02', 1),
    (3, 5, 7, 2, '2026-09-01', '2026-09-15', '2026-09-10', 2),
    (4, 2, 6, 2, '2026-10-12', '2026-12-31', NULL, 0),
    (5, 7, 8, 3, '2026-10-05', '2027-01-15', NULL, 1),
    (6, 9, 4, 3, '2026-09-14', '2026-09-28', NULL, 0),
    (7, 11, 5, 2, '2026-09-01', '2026-09-20', NULL, 2),
    (8, 2, 7, 3, '2026-07-01', '2026-07-15', '2026-07-14', 0);

-- Ajusta os contadores de id, porque os registros acima foram inseridos com ids fixos.
-- Sem isso, o primeiro cadastro feito pelo sistema tentaria usar o id 1 e daria erro de chave duplicada.
SELECT setval(pg_get_serial_sequence('courses', 'id'), (SELECT MAX(id) FROM courses));
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));
SELECT setval(pg_get_serial_sequence('authors', 'id'), (SELECT MAX(id) FROM authors));
SELECT setval(pg_get_serial_sequence('categories', 'id'), (SELECT MAX(id) FROM categories));
SELECT setval(pg_get_serial_sequence('books', 'id'), (SELECT MAX(id) FROM books));
SELECT setval(pg_get_serial_sequence('book_copies', 'id'), (SELECT MAX(id) FROM book_copies));
SELECT setval(pg_get_serial_sequence('loans', 'id'), (SELECT MAX(id) FROM loans));
