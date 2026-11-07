package br.edu.fatec.libee.backend.repository;

import br.edu.fatec.libee.backend.AbstractIntegrationTest;
import br.edu.fatec.libee.backend.entity.Course;
import br.edu.fatec.libee.backend.entity.Student;
import br.edu.fatec.libee.backend.entity.User;
import br.edu.fatec.libee.backend.enums.AffiliationType;
import br.edu.fatec.libee.backend.enums.UserProfile;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

class UserPersistenceIT extends AbstractIntegrationTest {

    @Autowired UserRepository userRepository;
    @Autowired StudentRepository studentRepository;
    @Autowired EntityManager entityManager;

    @Test
    @DisplayName("Persiste o aluno vinculado ao usuário e ao curso")
    void persistsStudentLinkedToUserAndCourse() {
        Course course = testData.saveCourse("Curso de Teste");
        User user = testData.saveUser("Usuário de Teste", "ana.persistence@test.com", null,
                AffiliationType.STUDENT, UserProfile.READER);
        testData.saveStudent(user, course);

        // força o SQL real e descarta o cache, para ler do banco
        entityManager.flush();
        entityManager.clear();

        Student found = studentRepository.findById(user.getId()).orElseThrow();
        assertThat(found.getUser().getEmail()).isEqualTo("ana.persistence@test.com");
        assertThat(found.getUser().getProfile()).isEqualTo(UserProfile.READER);
        assertThat(found.getCourse().getName()).isEqualTo("Curso de Teste");
    }

    @Test
    @DisplayName("Busca usuário por e-mail ignorando maiúsculas e minúsculas")
    void findsUserByEmailIgnoringCase() {
        testData.saveUser("Usuário de Teste", "maria.persistence@test.com", null,
                AffiliationType.PROFESSOR, UserProfile.READER);

        assertThat(userRepository.findByEmailIgnoreCase("MARIA.Persistence@TEST.com")).isPresent();
        assertThat(userRepository.existsByEmailIgnoreCase("MARIA.PERSISTENCE@TEST.COM")).isTrue();
        assertThat(userRepository.existsByEmailIgnoreCase("ninguem@test.com")).isFalse();
    }
}
