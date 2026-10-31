package br.edu.fatec.libee.backend.repository;

import br.edu.fatec.libee.backend.entity.Category;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Integer> {
    Optional<Category> findById(Integer categoryId);
}
