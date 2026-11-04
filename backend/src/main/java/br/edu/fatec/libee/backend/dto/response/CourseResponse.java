package br.edu.fatec.libee.backend.dto.response;

import br.edu.fatec.libee.backend.entity.Course;

public record CourseResponse(Integer id, String name) {
    public static CourseResponse from(Course course) {
        return new CourseResponse(course.getId(), course.getName());
    }
}
