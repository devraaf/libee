package br.edu.fatec.libee.backend.repository;

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

    List<Copy> findByBookIdOrderByAccessionNumberAsc(Integer bookId );
}
