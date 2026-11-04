package br.edu.fatec.libee.backend.service;

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

        String email = request.email().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResourceAlreadyExistsException("Já existe um usuário com este e-mail.");
        }

        Course course = null;
        if (isStudent) {
            course = courseRepository.findById(request.courseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Curso não encontrado."));
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPhone(request.phone());
        user.setAffiliationType(request.affiliationType());
        user.setProfile(UserProfile.READER);
        userRepository.save(user);

        if (isStudent) {
            Student student = new Student();
            student.setUser(user);
            student.setCourse(course);
            studentRepository.save(student);
        }

        return UserResponse.from(user);
    }
}
