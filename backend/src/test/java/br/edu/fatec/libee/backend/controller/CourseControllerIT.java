package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.AbstractIntegrationTest;
import br.edu.fatec.libee.backend.repository.CourseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@WithMockUser(roles = "ADMINISTRATOR")
public class CourseControllerIT extends AbstractIntegrationTest {

    @Autowired CourseRepository courseRepository;

    @BeforeEach
    void setUp() {
        // Esvazia cursos (e alunos) para o teste não depender de dados pré-existentes
        truncate("students", "courses");
    }

    // TESTES DE POST /courses - Cadastro de curso
    @Test
    @DisplayName("Cadastra curso e retorna 201 quando o nome é válido")
    void createsCourse_whenNameIsValid() throws Exception {
        mockMvc.perform(postJson("/courses",
                        "{\"name\": \"Desenvolvimento de Software Multiplataforma\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Desenvolvimento de Software Multiplataforma"));

        assertEquals(1, courseRepository.count());
    }

    @Test
    @DisplayName("Remove espaços nas pontas do nome ao cadastrar")
    void trimsName_whenNameHasSurroundingSpaces() throws Exception {
        mockMvc.perform(postJson("/courses", "{\"name\": \"  Gestão Empresarial  \"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Gestão Empresarial"));
    }

    @Test
    @DisplayName("Retorna 400 quando o nome está em branco")
    void returnsBadRequest_whenNameIsBlank() throws Exception {
        mockMvc.perform(postJson("/courses", "{\"name\": \"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("name"));

        assertEquals(0, courseRepository.count());
    }

    @Test
    @DisplayName("Retorna 400 quando o nome não é informado")
    void returnsBadRequest_whenNameIsMissing() throws Exception {
        mockMvc.perform(postJson("/courses", "{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("name"));
    }

    @Test
    @DisplayName("Retorna 400 quando o nome passa de 150 caracteres")
    void returnsBadRequest_whenNameExceedsMaxLength() throws Exception {
        mockMvc.perform(postJson("/courses", "{\"name\": \"" + "a".repeat(151) + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("name"));
    }

    @Test
    @DisplayName("Retorna 409 quando o nome já existe, ignorando maiúsculas e minúsculas")
    void returnsConflict_whenNameAlreadyExistsIgnoringCase() throws Exception {
        testData.saveCourse("Análise e Desenvolvimento de Sistemas");

        mockMvc.perform(postJson("/courses",
                        "{\"name\": \"ANÁLISE E DESENVOLVIMENTO DE SISTEMAS\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Recurso já cadastrado"));

        assertEquals(1, courseRepository.count());
    }

    // TESTES DE GET /courses - Listagem de cursos
    @Test
    @DisplayName("Lista todos os cursos ordenados por nome")
    void listsCourses_orderedByName() throws Exception {
        // Salvos fora de ordem de propósito
        testData.saveCourse("Logística");
        testData.saveCourse("Análise e Desenvolvimento de Sistemas");
        testData.saveCourse("Gestão Empresarial");

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
}
