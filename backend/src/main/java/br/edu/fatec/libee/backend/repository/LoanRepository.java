package br.edu.fatec.libee.backend.repository;

import br.edu.fatec.libee.backend.entity.Loan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface LoanRepository extends JpaRepository<Loan, Integer>, JpaSpecificationExecutor<Loan> {
    @Override
    @EntityGraph(attributePaths = {"copy", "copy.book"}) // Carrega exemplar e livro na mesma query.
    Page<Loan> findAll(Specification<Loan> spec, Pageable pageable);
}
