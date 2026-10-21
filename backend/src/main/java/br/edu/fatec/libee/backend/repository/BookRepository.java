package br.edu.fatec.libee.backend.repository;

import br.edu.fatec.libee.backend.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface BookRepository extends JpaRepository<Book, Integer>, JpaSpecificationExecutor<Book> {
    @Override
    @EntityGraph(attributePaths = "category") // Carrega a categoria junto com a página
    Page<Book> findAll(Specification<Book> spec, Pageable pageable);
}
