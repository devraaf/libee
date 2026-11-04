package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.dto.request.RegisterLibrarianRequest;
import br.edu.fatec.libee.backend.dto.request.RegisterReaderRequest;
import br.edu.fatec.libee.backend.dto.response.UserResponse;
import br.edu.fatec.libee.backend.entity.Course;
import br.edu.fatec.libee.backend.entity.Student;
import br.edu.fatec.libee.backend.entity.User;
import br.edu.fatec.libee.backend.enums.AffiliationType;
import br.edu.fatec.libee.backend.enums.UserProfile;
import br.edu.fatec.libee.backend.exception.InvalidFieldException;
import br.edu.fatec.libee.backend.exception.ResourceAlreadyExistsException;
import br.edu.fatec.libee.backend.exception.ResourceNotFoundException;
import br.edu.fatec.libee.backend.repository.CourseRepository;
import br.edu.fatec.libee.backend.repository.StudentRepository;
import br.edu.fatec.libee.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse createReader(RegisterReaderRequest request) {
        boolean isStudent = request.affiliationType() == AffiliationType.STUDENT;

        if (isStudent && request.courseId() == null) {
            throw new InvalidFieldException("courseId", "O curso é obrigatório para alunos.");
        }
        if (!isStudent && request.courseId() != null) {
            throw new InvalidFieldException("courseId", "O curso só deve ser informado para alunos.");
        }

        Course course = null;
        if (isStudent) {
            course = courseRepository.findById(request.courseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Curso não encontrado."));
        }

        User user = saveUser(request.name(), request.email(), request.password(), request.phone(), request.affiliationType(), UserProfile.READER);

        if (isStudent) {
            Student student = new Student();
            student.setUser(user);
            student.setCourse(course);
            studentRepository.save(student);
        }

        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse createLibrarian(RegisterLibrarianRequest request) {
        if (request.affiliationType() == AffiliationType.STUDENT) {
            throw new InvalidFieldException("affiliationType",
                    "O bibliotecário não pode ter vínculo de aluno.");
        }
        User user = saveUser(request.name(), request.email(), request.password(),
                request.phone(), request.affiliationType(), UserProfile.LIBRARIAN);
        return UserResponse.from(user);
    }

    private User saveUser(String name, String email, String password, String phone,
                          AffiliationType affiliationType, UserProfile profile) {
        String normalizedEmail = email.toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResourceAlreadyExistsException("Já existe um usuário com este e-mail.");
        }

        User user = new User();
        user.setName(name.trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setPhone(phone);
        user.setAffiliationType(affiliationType);
        user.setProfile(profile);
        return userRepository.save(user);
    }
}
