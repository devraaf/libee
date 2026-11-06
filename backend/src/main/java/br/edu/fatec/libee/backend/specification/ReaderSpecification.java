package br.edu.fatec.libee.backend.specification;

import br.edu.fatec.libee.backend.entity.LoanStatusView;
import br.edu.fatec.libee.backend.entity.Student;
import br.edu.fatec.libee.backend.entity.User;
import br.edu.fatec.libee.backend.enums.AffiliationType;
import br.edu.fatec.libee.backend.enums.LoanStatus;
import br.edu.fatec.libee.backend.enums.ReaderStatus;
import br.edu.fatec.libee.backend.enums.UserProfile;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public final class ReaderSpecification {
    private ReaderSpecification() {}

    // Sempre aplicado: só usuários com perfil READER
    public static Specification<User> isReader() {
        return (root, query, cb) -> cb.equal(root.get("profile"), UserProfile.READER);
    }

    // Busca por nome ou e-mail, sem diferenciar maiúsculas
    public static Specification<User> matchesSearch(String q) {
        return (root, query, cb) -> {
            if (q == null || q.isBlank()) {
                return null; // sem filtro
            }
            String like = "%" + escapeLike(q.trim().toLowerCase()) + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), like, '\\'),
                    cb.like(cb.lower(root.get("email")), like, '\\'));
        };
    }

    public static Specification<User> hasAffiliationType(AffiliationType type) {
        return (root, query, cb) -> type == null
                ? null
                : cb.equal(root.get("affiliationType"), type);
    }

    // Curso do aluno: exists em Student (a PK de Student é a mesma de User)
    public static Specification<User> hasCourse(Integer courseId) {
        return (root, query, cb) -> {
            if (courseId == null) {
                return null; // sem filtro
            }
            Subquery<Integer> sub = query.subquery(Integer.class);
            Root<Student> s = sub.from(Student.class);
            sub.select(s.get("id")).where(
                    cb.equal(s.get("id"), root.get("id")),
                    cb.equal(s.get("course").get("id"), courseId));
            return cb.exists(sub);
        };
    }

    // Leitores com pelo menos um empréstimo em algum dos status informados.
    // Mesma regra de LoanStatus.of, traduzida para SQL.
    public static Specification<User> hasStatus(Collection<ReaderStatus> statuses) {
        return (root, query, cb) -> {
            if (statuses == null || statuses.isEmpty()) {
                return null; // sem filtro
            }

            Subquery<Integer> sub = query.subquery(Integer.class);
            Root<LoanStatusView> loan = sub.from(LoanStatusView.class);
            sub.select(loan.get("id")).where(
                    cb.equal(loan.get("readerId"), root.get("id")),
                    cb.equal(loan.get("status"), LoanStatus.OVERDUE));
            Predicate hasOverdueLoan = cb.exists(sub);

            List<Predicate> anyOf = new ArrayList<>(statuses.size());
            for (ReaderStatus status : statuses) {
                anyOf.add(status == ReaderStatus.PENDING
                        ? hasOverdueLoan
                        : cb.not(hasOverdueLoan));
            }
            return cb.or(anyOf.toArray(new Predicate[0]));
        };
    }

    // Escapa %, _ e \ para que o termo do usuário não vire curinga do LIKE
    private static String escapeLike(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}