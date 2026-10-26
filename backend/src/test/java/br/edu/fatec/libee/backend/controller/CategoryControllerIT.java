package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.entity.Category;
import br.edu.fatec.libee.backend.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
@WithMockUser
public class CategoryControllerIT {
    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16");

    @Autowired MockMvc mockMvc;
    @Autowired CategoryRepository categoryRepository;
    @Autowired JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        // Esvazia o catálogo: a migration insere categorias de exemplo no banco
        // (desfeito ao fim do teste pelo @Transactional)
        jdbcTemplate.execute(
                "TRUNCATE TABLE loans, book_copies, book_author, books, authors, categories " +
                        "RESTART IDENTITY CASCADE");
    }

    @Test
    @DisplayName("Retorna as categorias em ordem alfabética, mesmo salvas fora de ordem")
    void returnsCategoriesOrderedByName_whenCategoriesExist() throws Exception {
        saveCategory("Tecnologia");
        saveCategory("Ciencias");
        saveCategory("Romance");

        mockMvc.perform(get("/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].name").value("Ciencias"))
                .andExpect(jsonPath("$[1].name").value(  "Romance"))
                .andExpect(jsonPath("$[2].name").value("Tecnologia"));
    }

    @Test
    @DisplayName("Retorna o id de cada categoria")
    void returnsCategoryIds_whenCategoriesExist() throws Exception {
        Category ciencias = saveCategory("Ciencias");
        Category romance = saveCategory("Romance");

        mockMvc.perform(get("/categories"))
                .andExpect(jsonPath("$[0].id").value(ciencias.getId()))
                .andExpect(jsonPath("$[1].id").value(romance.getId()));
    }

    @Test
    @DisplayName("Retorna apenas id e nome em cada categoria")
    void returnsOnlyIdAndName_inEachCategory() throws Exception {
        saveCategory("Ciencias");

        mockMvc.perform(get("/categories"))
                .andExpect(jsonPath("$[0].id").exists())
                .andExpect(jsonPath("$[0].name").exists())
                .andExpect(jsonPath("$[0].*", hasSize(2)));
    }

    @Test
    @DisplayName("Retorna 200 com lista vazia quando não há categorias cadastradas")
    void returnsEmptyList_whenThereAreNoCategories() throws Exception {
        mockMvc.perform(get("/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    private Category saveCategory(String name) {
        Category category = new Category();
        category.setName(name);
        return categoryRepository.save(category);
    }
}
