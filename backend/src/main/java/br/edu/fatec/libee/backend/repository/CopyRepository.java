package br.edu.fatec.libee.backend.repository;

import br.edu.fatec.libee.backend.dto.response.StatusCount;
import br.edu.fatec.libee.backend.dto.response.BookCopyCount;
import br.edu.fatec.libee.backend.entity.Copy;
import br.edu.fatec.libee.backend.enums.CopyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Set;

public interface CopyRepository extends JpaRepository<Copy, Integer> {
    // Ids (dentre os informados) que possuem ao menos um exemplar com o status dado
    @Query("select distinct c.book.id from Copy c where c.book.id in :bookIds and c.status = :status")
    Set<Integer> findBookIdsWithStatus(@Param("bookIds") Collection<Integer> bookIds,
                                       @Param("status") CopyStatus status);

    @Query("select new br.edu.fatec.libee.backend.dto.response.StatusCount(c.status, count(c)) " +
            "from Copy c group by c.status")
    List<StatusCount> countByStatus();
    List<Copy> findByBookIdOrderByAccessionNumberAsc(Integer bookId );
    @Query("select new br.edu.fatec.libee.backend.dto.response.BookCopyCount(" +
            "c.book.id, count(c), " +
            "sum(case when c.status = :status then 1L else 0L end)) " +
            "from Copy c where c.book.id in :bookIds group by c.book.id")
    List<BookCopyCount> countCopiesByBookIds(@Param("bookIds") Collection<Integer> bookIds,
                                             @Param("status") CopyStatus status);
}
