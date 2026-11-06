package br.edu.fatec.libee.backend.entity;

import br.edu.fatec.libee.backend.enums.LoanStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import org.hibernate.annotations.Immutable;

@Entity
@Table(name = "vw_loans")
@Immutable
@Getter
public class LoanStatusView {
    @Id
    private Integer id;

    @Column(name = "reader_id")
    private Integer readerId;

    @Enumerated(EnumType.STRING)
    private LoanStatus status;
}
