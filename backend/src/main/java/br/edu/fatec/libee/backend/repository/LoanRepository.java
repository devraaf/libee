package br.edu.fatec.libee.backend.repository;

import br.edu.fatec.libee.backend.entity.Loan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.Optional;

public interface LoanRepository extends JpaRepository<Loan, Integer>, JpaSpecificationExecutor<Loan> {
    @Override
    @EntityGraph(attributePaths = {"copy", "copy.book", "reader"}) // Carrega exemplar e livro na mesma query.
    Page<Loan> findAll(Specification<Loan> spec, Pageable pageable);

    boolean existsByCopyBookIdAndReturnDateIsNull(Integer bookId);
    boolean existsByCopyIdAndReturnDateIsNull(Integer copyId);

    @Query("select l from Loan l where l.returnDate is null and l.dueDate < :today")
    Page<Loan> findOverdue(LocalDate today, Pageable pageable);

    // No máximo um: o índice uq_loan_active_copy garante um empréstimo sem devolução por exemplar
    Optional<Loan> findByCopyIdAndReturnDateIsNull(Integer copyId);

    Optional<Loan> findByIdAndReaderId(Integer id, Integer readerId);
}
