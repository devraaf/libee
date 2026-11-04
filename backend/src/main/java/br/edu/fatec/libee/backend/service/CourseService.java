package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.dto.request.CreateCourseRequest;
import br.edu.fatec.libee.backend.dto.response.CourseResponse;
import br.edu.fatec.libee.backend.entity.Course;
import br.edu.fatec.libee.backend.exception.ResourceAlreadyExistsException;
import br.edu.fatec.libee.backend.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;

    @Transactional
    public CourseResponse create(CreateCourseRequest request) {
        String name = request.name().trim();
        if (courseRepository.existsByNameIgnoreCase(name)) {
            throw new ResourceAlreadyExistsException("Já existe um curso com o nome \"" + name + "\".");
        }
        Course course = new Course();
        course.setName(name);
        return CourseResponse.from(courseRepository.save(course));
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> findAll() {
        return courseRepository.findAllByOrderByNameAsc().stream()
                .map(CourseResponse::from)
                .toList();
    }
}
