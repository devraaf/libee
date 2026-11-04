package br.edu.fatec.libee.backend.repository;

import br.edu.fatec.libee.backend.entity.Author;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface AuthorRepository extends JpaRepository<Author, Integer> {
    // Recebe os nomes já em minúsculas
    @Query("select a from Author a where lower(a.name) in :lowerNames")
    List<Author> findByLowerNameIn(@Param("lowerNames") Collection<String> lowerNames);
}
