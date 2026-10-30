package br.edu.fatec.libee.backend.repository;

import br.edu.fatec.libee.backend.entity.Loan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;

public interface LoanRepository extends JpaRepository<Loan, Integer> {
    boolean existsByCopyBookIdAndReturnDateIsNull(Integer bookId);
    boolean existsByCopyIdAndReturnDateIsNull(Integer copyId);

    @Query("select l from Loan l where l.returnDate is null and l.dueDate < :today")
    Page<Loan> findOverdue(LocalDate today, Pageable pageable);



}
