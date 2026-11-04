package br.edu.fatec.libee.backend;

import br.edu.fatec.libee.backend.entity.Category;
import br.edu.fatec.libee.backend.entity.Course;
import br.edu.fatec.libee.backend.entity.User;
import br.edu.fatec.libee.backend.enums.AffiliationType;
import br.edu.fatec.libee.backend.enums.UserProfile;
import br.edu.fatec.libee.backend.repository.CategoryRepository;
import br.edu.fatec.libee.backend.repository.CourseRepository;
import br.edu.fatec.libee.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.test.context.TestComponent;
import org.springframework.security.crypto.password.PasswordEncoder;

@TestComponent
@RequiredArgsConstructor
public class TestData {

    public static final String PASSWORD = "Senha@123";

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    public User saveUser(String email, UserProfile profile) {
        User user = new User();
        user.setName("Usuário de Teste");
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(PASSWORD));
        user.setAffiliationType(AffiliationType.EMPLOYEE);
        user.setProfile(profile);
        return userRepository.save(user);
    }

    public Course saveCourse(String name) {
        Course course = new Course();
        course.setName(name);
        return courseRepository.save(course);
    }

    public Category saveCategory(String name) {
        Category category = new Category();
        category.setName(name);
        return categoryRepository.save(category);
    }
}
