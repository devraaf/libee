package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.entity.Course;
import br.edu.fatec.libee.backend.repository.CourseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@WithMockUser(roles = "ADMINISTRATOR")
@AutoConfigureMockMvc
@Transactional
@Testcontainers
public class CourseControllerIT {
    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16");

    @Autowired MockMvc mockMvc;
    @Autowired CourseRepository courseRepository;
    @Autowired JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        // Esvazia cursos (e alunos, por cascata) para o teste não depender de dados pré-existentes
        jdbcTemplate.execute("TRUNCATE TABLE students, courses RESTART IDENTITY CASCADE");
    }

    // TESTES DE POST /courses - Cadastro de curso
    @Test
    @DisplayName("Cadastra curso e retorna 201 quando o nome é válido")
    void createsCourse_whenNameIsValid() throws Exception {
        mockMvc.perform(post("/courses").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Desenvolvimento de Software Multiplataforma\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Desenvolvimento de Software Multiplataforma"));

        assertEquals(1, courseRepository.count());
    }

    @Test
    @DisplayName("Remove espaços nas pontas do nome ao cadastrar")
    void trimsName_whenNameHasSurroundingSpaces() throws Exception {
        mockMvc.perform(post("/courses").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"  Gestão Empresarial  \"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Gestão Empresarial"));
    }

    @Test
    @DisplayName("Retorna 400 quando o nome está em branco")
    void returnsBadRequest_whenNameIsBlank() throws Exception {
        mockMvc.perform(post("/courses").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("name"));

        assertEquals(0, courseRepository.count());
    }

    @Test
    @DisplayName("Retorna 400 quando o nome não é informado")
    void returnsBadRequest_whenNameIsMissing() throws Exception {
        mockMvc.perform(post("/courses").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("name"));
    }

    @Test
    @DisplayName("Retorna 400 quando o nome passa de 150 caracteres")
    void returnsBadRequest_whenNameExceedsMaxLength() throws Exception {
        mockMvc.perform(post("/courses").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"" + "a".repeat(151) + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("name"));
    }

    @Test
    @DisplayName("Retorna 409 quando o nome já existe, ignorando maiúsculas e minúsculas")
    void returnsConflict_whenNameAlreadyExistsIgnoringCase() throws Exception {
        saveCourse("Análise e Desenvolvimento de Sistemas");

        mockMvc.perform(post("/courses").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"ANÁLISE E DESENVOLVIMENTO DE SISTEMAS\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Recurso já cadastrado"));

        assertEquals(1, courseRepository.count());
    }

    // TESTES DE GET /courses - Listagem de cursos
    @Test
    @DisplayName("Lista todos os cursos ordenados por nome")
    void listsCourses_orderedByName() throws Exception {
        // Salvos fora de ordem de propósito
        saveCourse("Logística");
        saveCourse("Análise e Desenvolvimento de Sistemas");
        saveCourse("Gestão Empresarial");

        mockMvc.perform(get("/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].name").value("Análise e Desenvolvimento de Sistemas"))
                .andExpect(jsonPath("$[1].name").value("Gestão Empresarial"))
                .andExpect(jsonPath("$[2].name").value("Logística"))
                .andExpect(jsonPath("$[0].id").isNumber());
    }

    @Test
    @DisplayName("Retorna lista vazia quando não há cursos cadastrados")
    void returnsEmptyList_whenThereAreNoCourses() throws Exception {
        mockMvc.perform(get("/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    private Course saveCourse(String name) {
        Course course = new Course();
        course.setName(name);
        return courseRepository.save(course);
    }
}
