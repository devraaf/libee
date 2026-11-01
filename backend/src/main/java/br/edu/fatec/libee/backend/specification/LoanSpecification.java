package br.edu.fatec.libee.backend.specification;

import br.edu.fatec.libee.backend.entity.Author;
import br.edu.fatec.libee.backend.entity.Book;
import br.edu.fatec.libee.backend.entity.Loan;
import br.edu.fatec.libee.backend.enums.LoanStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public final class LoanSpecification {
    private LoanSpecification() {}

    // Isolamento: sempre aplicado, só os empréstimos do leitor informado
    public static Specification<Loan> forReader(Integer readerId) {
        return (root, query, cb) -> cb.equal(root.get("reader").get("id"), readerId);
    }

    // Mesma regra de LoanStatus.of, traduzida para SQL:
    // devolvido = tem returnDate; atrasado = aberto e vencido (dueDate < hoje); em dia = aberto e dueDate >= hoje
    public static Specification<Loan> hasStatusIn(Collection<LoanStatus> statuses, LocalDate today) {
        return (root, query, cb) -> {
            if (statuses == null || statuses.isEmpty()) {
                return null; // sem filtro
            }
            Path<LocalDate> dueDate = root.get("dueDate");
            Predicate open = cb.isNull(root.get("returnDate"));

            List<Predicate> anyOf = new ArrayList<>();
            for (LoanStatus status : statuses) {
                anyOf.add(switch (status) {
                    case RETURNED -> cb.isNotNull(root.get("returnDate"));
                    case OVERDUE -> cb.and(open, cb.lessThan(dueDate, today));
                    case ON_TIME -> cb.and(open, cb.greaterThanOrEqualTo(dueDate, today));
                });
            }
            return cb.or(anyOf.toArray(new Predicate[0]));
        };
    }

    // Busca por título ou autor, sem diferenciar maiúsculas
    public static Specification<Loan> matchesSearch(String q) {
        return (root, query, cb) -> {
            if (q == null || q.isBlank()) {
                return null; // sem filtro
            }
            String like = "%" + escapeLike(q.trim().toLowerCase()) + "%";
            Path<Book> book = root.get("copy").get("book");

            // Autor: subquery com exists, para não duplicar empréstimos na paginação
            Subquery<Integer> sub = query.subquery(Integer.class);
            Root<Book> b = sub.from(Book.class);
            Join<Book, Author> a = b.join("authors");
            sub.select(b.get("id")).where(
                    cb.equal(b.get("id"), book.get("id")),
                    cb.like(cb.lower(a.get("name")), like, '\\'));

            return cb.or(
                    cb.like(cb.lower(book.get("title")), like, '\\'),
                    cb.exists(sub));
        };
    }

    // Escapa %, _ e \ para que o termo do usuário não vire curinga do LIKE
    private static String escapeLike(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}