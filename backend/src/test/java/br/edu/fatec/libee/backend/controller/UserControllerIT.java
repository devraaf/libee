package br.edu.fatec.libee.backend.controller;

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
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@WithMockUser(roles = "ADMINISTRATOR")
@AutoConfigureMockMvc
@Transactional
@Testcontainers
public class UserControllerIT {
    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16");

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        // Esvazia usuários (e o que depende deles) para o teste não depender de dados pré-existentes
        jdbcTemplate.execute("TRUNCATE TABLE loans, students, users RESTART IDENTITY CASCADE");
    }

    // TESTES DE POST /users/librarians - Cadastro de bibliotecário (administrador)
    @ParameterizedTest(name = "Cadastra bibliotecário com vínculo {0} e retorna 201")
    @EnumSource(value = AffiliationType.class, names = {"EMPLOYEE", "PROFESSOR"})
    void createsLibrarian_whenAdministratorSendsValidData(AffiliationType affiliationType) throws Exception {
        mockMvc.perform(post("/users/librarians")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(librarianJson("carla@test.com", "Senha@123", affiliationType.name())))
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
        mockMvc.perform(post("/users/librarians")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(librarianJson("CARLA@Test.com", "Senha@123", "EMPLOYEE")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("carla@test.com"));
    }

    @Test
    @DisplayName("O bibliotecário cadastrado consegue entrar com a senha definida")
    void allowsLogin_afterLibrarianRegistration() throws Exception {
        mockMvc.perform(post("/users/librarians")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(librarianJson("carla@test.com", "Senha@123", "EMPLOYEE")))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"carla@test.com\", \"password\": \"Senha@123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile").value("LIBRARIAN"));
    }

    @Test
    @DisplayName("Retorna 400 quando o vínculo é de aluno")
    void returnsBadRequest_whenAffiliationIsStudent() throws Exception {
        mockMvc.perform(post("/users/librarians")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(librarianJson("carla@test.com", "Senha@123", "STUDENT")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("affiliationType"));

        assertEquals(0, userRepository.count());
    }

    @Test
    @DisplayName("Retorna 409 quando o e-mail já está cadastrado, ignorando maiúsculas e minúsculas")
    void returnsConflict_whenEmailAlreadyExists() throws Exception {
        saveUser("carla@test.com", UserProfile.READER);

        mockMvc.perform(post("/users/librarians")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(librarianJson("CARLA@test.com", "Senha@123", "EMPLOYEE")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Recurso já cadastrado"));

        assertEquals(1, userRepository.count());
    }

    @Test
    @DisplayName("Retorna 400 quando a senha tem menos de 8 caracteres")
    void returnsBadRequest_whenPasswordIsTooShort() throws Exception {
        mockMvc.perform(post("/users/librarians")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(librarianJson("carla@test.com", "curta", "EMPLOYEE")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("password"));
    }

    @Test
    @DisplayName("Retorna 400 com todos os campos obrigatórios ausentes")
    void returnsBadRequest_whenRequiredFieldsAreMissing() throws Exception {
        mockMvc.perform(post("/users/librarians")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.length()").value(4))
                .andExpect(jsonPath("$.errors[0].field").value("affiliationType"))
                .andExpect(jsonPath("$.errors[1].field").value("email"))
                .andExpect(jsonPath("$.errors[2].field").value("name"))
                .andExpect(jsonPath("$.errors[3].field").value("password"));
    }

    // TESTES DE AUTORIZAÇÃO - somente administrador cadastra bibliotecário
    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna 403 quando o usuário é bibliotecário")
    void returnsForbidden_whenUserIsLibrarian() throws Exception {
        mockMvc.perform(post("/users/librarians")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(librarianJson("carla@test.com", "Senha@123", "EMPLOYEE")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.title").value("Acesso negado"));

        assertEquals(0, userRepository.count());
    }

    @Test
    @WithMockUser(roles = "READER")
    @DisplayName("Retorna 403 quando o usuário é leitor")
    void returnsForbidden_whenUserIsReader() throws Exception {
        mockMvc.perform(post("/users/librarians")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(librarianJson("carla@test.com", "Senha@123", "EMPLOYEE")))
                .andExpect(status().isForbidden());

        assertEquals(0, userRepository.count());
    }

    @Test
    @WithAnonymousUser
    @DisplayName("Retorna 401 quando não há usuário autenticado")
    void returnsUnauthorized_whenUserIsAnonymous() throws Exception {
        mockMvc.perform(post("/users/librarians")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(librarianJson("carla@test.com", "Senha@123", "EMPLOYEE")))
                .andExpect(status().isUnauthorized());

        assertEquals(0, userRepository.count());
    }

    private User saveUser(String email, UserProfile profile) {
        User user = new User();
        user.setName("Usuário de Teste");
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("Senha@123"));
        user.setAffiliationType(AffiliationType.EMPLOYEE);
        user.setProfile(profile);
        return userRepository.save(user);
    }

    private String librarianJson(String email, String password, String affiliationType) {
        return """
                {"name": "Carla Souza", "email": "%s", "password": "%s", "affiliationType": "%s"}"""
                .formatted(email, password, affiliationType);
    }
}
