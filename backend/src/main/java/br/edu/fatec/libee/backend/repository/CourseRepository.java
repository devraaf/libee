package br.edu.fatec.libee.backend.repository;

import br.edu.fatec.libee.backend.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepository extends JpaRepository<Course, Integer> {
}
