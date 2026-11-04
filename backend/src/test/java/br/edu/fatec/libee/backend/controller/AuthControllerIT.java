package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.entity.User;
import br.edu.fatec.libee.backend.enums.AffiliationType;
import br.edu.fatec.libee.backend.enums.UserProfile;
import br.edu.fatec.libee.backend.repository.UserRepository;
import com.jayway.jsonpath.JsonPath;
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
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
@Testcontainers
public class AuthControllerIT {
    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16");

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtDecoder jwtDecoder;
    @Autowired JdbcTemplate jdbcTemplate;

    private static final String PASSWORD = "Libee@2026";

    @BeforeEach
    void setUp() {
        // Esvazia usuários (e o que depende deles) para o teste não depender de dados pré-existentes
        jdbcTemplate.execute("TRUNCATE TABLE loans, students, users RESTART IDENTITY CASCADE");
    }

    // TESTES DE POST /auth/login - Login
    @ParameterizedTest(name = "Retorna token quando as credenciais são válidas (perfil {0})")
    @EnumSource(UserProfile.class)
    void returnsToken_whenCredentialsAreValid(UserProfile profile) throws Exception {
        User user = saveUser("user." + profile.name().toLowerCase() + "@test.com", profile);

        String body = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(user.getEmail(), PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.id").value(user.getId()))
                .andExpect(jsonPath("$.profile").value(profile.name()))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andReturn().getResponse().getContentAsString();

        // O token carrega o id (sub) e o perfil do usuário
        Jwt jwt = jwtDecoder.decode(JsonPath.read(body, "$.token"));
        assertEquals(String.valueOf(user.getId()), jwt.getSubject());
        assertEquals(profile.name(), jwt.getClaimAsString("profile"));
    }

    @Test
    @DisplayName("Aceita o e-mail com maiúsculas e minúsculas diferentes do cadastro")
    void returnsToken_whenEmailCaseDiffersFromRegistration() throws Exception {
        saveUser("maria@test.com", UserProfile.READER);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("MARIA@Test.com", PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    @DisplayName("O token devolvido no login acessa uma rota protegida")
    void allowsAccessToProtectedRoute_whenUsingTokenFromLogin() throws Exception {
        saveUser("ana@test.com", UserProfile.READER);

        String body = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("ana@test.com", PASSWORD)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = JsonPath.read(body, "$.token");

        mockMvc.perform(get("/categories").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Retorna 401 quando a senha está incorreta")
    void returnsUnauthorized_whenPasswordIsWrong() throws Exception {
        saveUser("ana@test.com", UserProfile.READER);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("ana@test.com", "senha-errada")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.title").value("Credenciais inválidas"))
                .andExpect(jsonPath("$.detail").value("E-mail ou senha incorretos."))
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    @Test
    @DisplayName("Retorna 401 com a mesma mensagem quando o e-mail não existe")
    void returnsUnauthorized_whenEmailDoesNotExist() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("ninguem@test.com", PASSWORD)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.title").value("Credenciais inválidas"))
                .andExpect(jsonPath("$.detail").value("E-mail ou senha incorretos."));
    }

    @Test
    @DisplayName("Retorna 400 quando e-mail e senha não são informados")
    void returnsBadRequest_whenFieldsAreMissing() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.length()").value(2))
                .andExpect(jsonPath("$.errors[0].field").value("email"))
                .andExpect(jsonPath("$.errors[1].field").value("password"));
    }

    @Test
    @DisplayName("Retorna 400 quando o e-mail tem formato inválido")
    void returnsBadRequest_whenEmailFormatIsInvalid() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("nao-e-um-email", PASSWORD)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("email"));
    }

    private User saveUser(String email, UserProfile profile) {
        User user = new User();
        user.setName("Usuário de Teste");
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(PASSWORD));
        user.setAffiliationType(AffiliationType.EMPLOYEE);
        user.setProfile(profile);
        return userRepository.save(user);
    }

    private String loginJson(String email, String password) {
        return "{\"email\": \"%s\", \"password\": \"%s\"}".formatted(email, password);
    }
}