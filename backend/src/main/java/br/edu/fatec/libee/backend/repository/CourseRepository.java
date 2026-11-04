package br.edu.fatec.libee.backend.repository;

import br.edu.fatec.libee.backend.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Integer> {
    boolean existsByNameIgnoreCase(String name);

    List<Course> findAllByOrderByNameAsc();
}
