package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.AbstractIntegrationTest;
import br.edu.fatec.libee.backend.entity.User;
import br.edu.fatec.libee.backend.enums.AffiliationType;
import br.edu.fatec.libee.backend.enums.UserProfile;
import br.edu.fatec.libee.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WithMockUser(roles = "ADMINISTRATOR")
public class UserControllerIT extends AbstractIntegrationTest {

    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        // Esvazia usuários (e o que depende deles) para o teste não depender de dados pré-existentes
        truncate("loans", "students", "users");
    }

    // TESTES DE POST /users/librarians - Cadastro de bibliotecário (administrador)
    @ParameterizedTest(name = "Cadastra bibliotecário com vínculo {0} e retorna 201")
    @EnumSource(value = AffiliationType.class, names = {"EMPLOYEE", "PROFESSOR"})
    void createsLibrarian_whenAdministratorSendsValidData(AffiliationType affiliationType) throws Exception {
        mockMvc.perform(postJson("/users/librarians",
                        librarianJson("carla@test.com", "Senha@123", affiliationType.name())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Carla Souza"))
                .andExpect(jsonPath("$.email").value("carla@test.com"))
                .andExpect(jsonPath("$.profile").value("LIBRARIAN"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        User saved = userRepository.findByEmailIgnoreCase("carla@test.com").orElseThrow();
        assertEquals(UserProfile.LIBRARIAN, saved.getProfile());
        assertTrue(passwordEncoder.matches("Senha@123", saved.getPasswordHash()));
    }

    @Test
    @DisplayName("Grava o e-mail em minúsculas")
    void storesEmailInLowerCase_whenEmailHasUpperCase() throws Exception {
        mockMvc.perform(postJson("/users/librarians",
                        librarianJson("CARLA@Test.com", "Senha@123", "EMPLOYEE")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("carla@test.com"));
    }

    @Test
    @DisplayName("O bibliotecário cadastrado consegue entrar com a senha definida")
    void allowsLogin_afterLibrarianRegistration() throws Exception {
        mockMvc.perform(postJson("/users/librarians",
                        librarianJson("carla@test.com", "Senha@123", "EMPLOYEE")))
                .andExpect(status().isCreated());

        mockMvc.perform(postJson("/auth/login",
                        "{\"email\": \"carla@test.com\", \"password\": \"Senha@123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile").value("LIBRARIAN"));
    }

    @Test
    @DisplayName("Retorna 400 quando o vínculo é de aluno")
    void returnsBadRequest_whenAffiliationIsStudent() throws Exception {
        mockMvc.perform(postJson("/users/librarians",
                        librarianJson("carla@test.com", "Senha@123", "STUDENT")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("affiliationType"));

        assertEquals(0, userRepository.count());
    }

    @Test
    @DisplayName("Retorna 409 quando o e-mail já está cadastrado, ignorando maiúsculas e minúsculas")
    void returnsConflict_whenEmailAlreadyExists() throws Exception {
        testData.saveUser("carla@test.com", UserProfile.READER);

        mockMvc.perform(postJson("/users/librarians",
                        librarianJson("CARLA@test.com", "Senha@123", "EMPLOYEE")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Recurso já cadastrado"));

        assertEquals(1, userRepository.count());
    }

    @Test
    @DisplayName("Retorna 400 quando a senha tem menos de 8 caracteres")
    void returnsBadRequest_whenPasswordIsTooShort() throws Exception {
        mockMvc.perform(postJson("/users/librarians",
                        librarianJson("carla@test.com", "curta", "EMPLOYEE")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("password"));
    }

    @Test
    @DisplayName("Retorna 400 com todos os campos obrigatórios ausentes")
    void returnsBadRequest_whenRequiredFieldsAreMissing() throws Exception {
        mockMvc.perform(postJson("/users/librarians", "{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.length()").value(4))
                .andExpect(jsonPath("$.errors[0].field").value("affiliationType"))
                .andExpect(jsonPath("$.errors[1].field").value("email"))
                .andExpect(jsonPath("$.errors[2].field").value("name"))
                .andExpect(jsonPath("$.errors[3].field").value("password"));
    }

    private String librarianJson(String email, String password, String affiliationType) {
        return """
                {"name": "Carla Souza", "email": "%s", "password": "%s", "affiliationType": "%s"}"""
                .formatted(email, password, affiliationType);
    }
}
