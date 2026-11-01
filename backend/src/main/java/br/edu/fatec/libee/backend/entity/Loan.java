package br.edu.fatec.libee.backend.entity;

import br.edu.fatec.libee.backend.enums.LoanStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "loans")
@Getter
@Setter
@NoArgsConstructor
public class Loan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "copy_id")
    private Copy copy;

    // Leitor que realizou o empréstimo
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reader_id")
    private User reader;

    // Bibliotecário que registrou o empréstimo
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "librarian_id")
    private User librarian;

    @Column(name = "loan_date", nullable = false)
    private LocalDate loanDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @Column(name = "renewal_count", nullable = false)
    private int renewalCount = 0;

    public LoanStatus getStatus(LocalDate today) {
        return LoanStatus.of(dueDate, returnDate, today);
    }

    public boolean isOpen() {
        return returnDate == null;
    }
}
