ALTER TABLE books
ALTER COLUMN publication_date TYPE INTEGER
    USING EXTRACT(YEAR FROM publication_date)::INTEGER;

ALTER TABLE books
    RENAME COLUMN publication_date TO publication_year;