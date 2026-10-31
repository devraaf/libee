package br.edu.fatec.libee.backend.repository;

import br.edu.fatec.libee.backend.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Integer> {
}
