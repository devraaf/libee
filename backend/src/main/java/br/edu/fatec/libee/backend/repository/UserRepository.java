package br.edu.fatec.libee.backend.repository;

import br.edu.fatec.libee.backend.entity.User;
import br.edu.fatec.libee.backend.enums.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByIdAndProfile(Integer id, UserProfile profile);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    public interface ReaderSummaryProjection {
        long getTotalReaders();
        long getReadersWithActiveLoans();
        long getReadersWithOverdueLoans();
    }

    @Query(value = """
        SELECT
            COUNT(*) AS "totalReaders",
            COUNT(*) FILTER (WHERE EXISTS (
                SELECT 1 FROM loans l
                WHERE l.reader_id = u.id AND l.return_date IS NULL
            )) AS "readersWithActiveLoans",
            COUNT(*) FILTER (WHERE EXISTS (
                SELECT 1 FROM loans l
                WHERE l.reader_id = u.id AND l.return_date IS NULL AND l.due_date < :today
            )) AS "readersWithOverdueLoans"
        FROM users u
        WHERE u.profile = 'READER'
        """, nativeQuery = true)
    ReaderSummaryProjection summarizeReaders(@Param("today") LocalDate today);
}
