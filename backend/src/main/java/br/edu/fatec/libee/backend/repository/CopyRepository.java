package br.edu.fatec.libee.backend.repository;

import br.edu.fatec.libee.backend.dto.response.StatusCount;
import br.edu.fatec.libee.backend.dto.response.BookCopyCount;
import br.edu.fatec.libee.backend.entity.Copy;
import br.edu.fatec.libee.backend.enums.CopyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CopyRepository extends JpaRepository<Copy, Integer> {
    // Ids (dentre os informados) que possuem ao menos um exemplar com o status dado
    @Query("select distinct c.book.id from Copy c " +
            "where c.book.id in :bookIds and c.status = :status and c.deletedAt is null")
    Set<Integer> findBookIdsWithStatus(@Param("bookIds") Collection<Integer> bookIds,
                                       @Param("status") CopyStatus status);

    List<Copy> findByBookIdAndDeletedAtIsNullOrderByAccessionNumberAsc(Integer bookId );

    @Query("select new br.edu.fatec.libee.backend.dto.response.StatusCount(c.status, count(c)) " +
            "from Copy c where c.deletedAt is null group by c.status")
    List<StatusCount> countByStatus();

    @Query("select new br.edu.fatec.libee.backend.dto.response.BookCopyCount(" +
            "c.book.id, count(c), " +
            "sum(case when c.status = :status then 1L else 0L end)) " +
            "from Copy c where c.book.id in :bookIds and c.deletedAt is null group by c.book.id")
    List<BookCopyCount> countCopiesByBookIds(@Param("bookIds") Collection<Integer> bookIds,
                                             @Param("status") CopyStatus status);

    // Tombos (dentre os informados) que já existem no banco
    @Query("select c.accessionNumber from Copy c where c.accessionNumber in :accessionNumbers")
    List<String> findExistingAccessionNumbers(@Param("accessionNumbers") Collection<String> accessionNumbers);

    // Exemplar ativo, que pertence ao livro da rota
    Optional<Copy> findByIdAndBookIdAndDeletedAtIsNull(Integer id, Integer bookId);

    long countByBookIdAndDeletedAtIsNull(Integer bookId);

    // Tombos dos exemplares ativos do livro com o status dado (usado para achar os emprestados)
    @Query("select c.accessionNumber from Copy c " +
            "where c.book.id = :bookId and c.status = :status and c.deletedAt is null " +
            "order by c.accessionNumber")
    List<String> findAccessionNumbersByBookIdAndStatus(@Param("bookId") Integer bookId,
                                                       @Param("status") CopyStatus status);

    // Exclui de uma vez todos os exemplares ativos do livro
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Copy c set c.deletedAt = :deletedAt where c.book.id = :bookId and c.deletedAt is null")
    int softDeleteByBookId(@Param("bookId") Integer bookId, @Param("deletedAt") Instant deletedAt);
}
