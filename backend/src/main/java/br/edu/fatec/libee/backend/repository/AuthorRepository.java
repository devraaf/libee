package br.edu.fatec.libee.backend.repository;

import br.edu.fatec.libee.backend.entity.Author;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthorRepository extends JpaRepository<Author, Integer> {
}
