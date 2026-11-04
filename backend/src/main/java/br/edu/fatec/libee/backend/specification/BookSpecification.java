package br.edu.fatec.libee.backend.specification;

import br.edu.fatec.libee.backend.entity.Author;
import br.edu.fatec.libee.backend.entity.Book;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class BookSpecification {
    private BookSpecification() {}
    public static Specification<Book> search(String q, Integer categoryId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isNull(root.get("deletedAt")));   // livro excluído nunca aparece

            if (q != null && !q.isBlank()) {
                String term = q.trim().toLowerCase();
                String like = "%" + escapeLike(term) + "%";

                // Título
                List<Predicate> anyOf = new ArrayList<>();
                anyOf.add(cb.like(cb.lower(root.get("title")), like, '\\'));

                // Autor: subquery com exists, para não duplicar livros na paginação
                Subquery<Integer> sub = query.subquery(Integer.class);
                Root<Book> b = sub.from(Book.class);
                Join<Book, Author> a = b.join("authors");
                sub.select(b.get("id")).where(
                        cb.equal(b.get("id"), root.get("id")),
                        cb.like(cb.lower(a.get("name")), like, '\\'));
                anyOf.add(cb.exists(sub));

                // ISBN: no banco é sem hífens, então normaliza o termo digitado
                String isbnTerm = term.replaceAll("[\\s-]", "").toUpperCase();
                if (!isbnTerm.isEmpty()) {
                    anyOf.add(cb.like(root.get("isbn"), "%" + escapeLike(isbnTerm) + "%", '\\'));
                }

                predicates.add(cb.or(anyOf.toArray(new Predicate[0])));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // Escapa %, _ e \ para que o termo do usuário não vire curinga do LIKE
    private static String escapeLike(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
