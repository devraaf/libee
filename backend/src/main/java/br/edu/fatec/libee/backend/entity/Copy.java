package br.edu.fatec.libee.backend.entity;

import br.edu.fatec.libee.backend.enums.CopyStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

@Entity
@Table(name = "book_copies")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class Copy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "accession_number", nullable = false, unique = true)
    private String accessionNumber;

    @Column(name = "physical_location")
    private String physicalLocation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CopyStatus status;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
