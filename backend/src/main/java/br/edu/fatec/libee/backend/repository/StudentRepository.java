package br.edu.fatec.libee.backend.repository;

import br.edu.fatec.libee.backend.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, Integer> {
}
