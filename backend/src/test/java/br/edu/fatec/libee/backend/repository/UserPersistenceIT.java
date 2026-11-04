package br.edu.fatec.libee.backend.repository;

import br.edu.fatec.libee.backend.entity.Course;
import br.edu.fatec.libee.backend.entity.Student;
import br.edu.fatec.libee.backend.entity.User;
import br.edu.fatec.libee.backend.enums.AffiliationType;
import br.edu.fatec.libee.backend.enums.UserProfile;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class UserPersistenceIT {

    @Autowired UserRepository userRepository;
    @Autowired StudentRepository studentRepository;
    @Autowired CourseRepository courseRepository;
    @Autowired EntityManager entityManager;

    @Test
    @DisplayName("Deve persistir o aluno vinculado ao curso")
    void shouldPersistStudentLinkedToUserAndCourse() {
        Course course = new Course();
        course.setName("Curso de Teste");
        courseRepository.save(course);

        User user = newUser("ana.persistence@test.com", AffiliationType.STUDENT);
        userRepository.save(user);

        Student student = new Student();
        student.setUser(user);
        student.setCourse(course);
        studentRepository.save(student);

        // força o SQL real e descarta o cache, para ler do banco
        entityManager.flush();
        entityManager.clear();

        Student found = studentRepository.findById(user.getId()).orElseThrow();
        assertThat(found.getUser().getEmail()).isEqualTo("ana.persistence@test.com");
        assertThat(found.getUser().getProfile()).isEqualTo(UserProfile.READER);
        assertThat(found.getCourse().getName()).isEqualTo("Curso de Teste");
    }

    @Test
    @DisplayName("Deve buscar usuário por e-mail ignorando letras maiúsculas")
    void shouldFindUserByEmailIgnoringCase() {
        userRepository.save(newUser("maria.persistence@test.com", AffiliationType.PROFESSOR));

        assertThat(userRepository.findByEmailIgnoreCase("MARIA.Persistence@TEST.com")).isPresent();
        assertThat(userRepository.existsByEmailIgnoreCase("MARIA.PERSISTENCE@TEST.COM")).isTrue();
        assertThat(userRepository.existsByEmailIgnoreCase("ninguem@test.com")).isFalse();
    }

    private User newUser(String email, AffiliationType affiliationType) {
        User user = new User();
        user.setName("Usuário de Teste");
        user.setEmail(email);
        user.setPasswordHash("hash-de-teste");
        user.setAffiliationType(affiliationType);
        user.setProfile(UserProfile.READER);
        return user;
    }
}
