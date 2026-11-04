package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.entity.Course;
import br.edu.fatec.libee.backend.entity.Student;
import br.edu.fatec.libee.backend.entity.User;
import br.edu.fatec.libee.backend.enums.AffiliationType;
import br.edu.fatec.libee.backend.enums.UserProfile;
import br.edu.fatec.libee.backend.repository.CourseRepository;
import br.edu.fatec.libee.backend.repository.StudentRepository;
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

import static org.junit.jupiter.api.Assertions.*;
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
    @Autowired StudentRepository studentRepository;
    @Autowired CourseRepository courseRepository;

    private static final String PASSWORD = "Libee@2026";

    @BeforeEach
    void setUp() {
        // Esvazia usuários (e o que depende deles) para o teste não depender de dados pré-existentes
        jdbcTemplate.execute("TRUNCATE TABLE loans, students, users, courses RESTART IDENTITY CASCADE");
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

    // TESTES DE POST /auth/register - Autocadastro de leitor
    @Test
    @DisplayName("Cadastra aluno com curso e retorna 201")
    void registersStudent_whenDataIsValid() throws Exception {
        Course course = saveCourse("Desenvolvimento de Software Multiplataforma");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name": "Maria Silva", "email": "maria@test.com", "password": "Senha@123",
                             "phone": "11987654321", "affiliationType": "STUDENT", "courseId": %d}"""
                                .formatted(course.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Maria Silva"))
                .andExpect(jsonPath("$.email").value("maria@test.com"))
                .andExpect(jsonPath("$.profile").value("READER"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.token").doesNotExist());

        User saved = userRepository.findByEmailIgnoreCase("maria@test.com").orElseThrow();
        assertEquals("11987654321", saved.getPhone());
        assertNotEquals("Senha@123", saved.getPasswordHash());
        assertTrue(passwordEncoder.matches("Senha@123", saved.getPasswordHash()));
        Student student = studentRepository.findById(saved.getId()).orElseThrow();
        assertEquals(course.getId(), student.getCourse().getId());
    }

    @ParameterizedTest(name = "Cadastra {0} sem curso e não cria registro de aluno")
    @EnumSource(value = AffiliationType.class, names = {"EMPLOYEE", "PROFESSOR"})
    void registersNonStudent_whenCourseIsNotProvided(AffiliationType affiliationType) throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson("joao@test.com", "Senha@123", affiliationType.name(), null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.profile").value("READER"));

        assertEquals(0, studentRepository.count());
    }

    @Test
    @DisplayName("Grava o e-mail em minúsculas")
    void storesEmailInLowerCase_whenEmailHasUpperCase() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson("MARIA@Test.com", "Senha@123", "PROFESSOR", null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("maria@test.com"));
    }

    @Test
    @DisplayName("Ignora o perfil enviado no corpo e cria sempre um leitor")
    void createsReader_whenBodyTriesToSetProfile() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name": "Intruso", "email": "intruso@test.com", "password": "Senha@123",
                             "affiliationType": "EMPLOYEE", "profile": "ADMINISTRATOR"}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.profile").value("READER"));
    }

    @Test
    @DisplayName("O leitor cadastrado consegue entrar com a senha escolhida")
    void allowsLogin_afterRegistration() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson("ana@test.com", "Senha@123", "PROFESSOR", null)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("ana@test.com", "Senha@123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile").value("READER"));
    }

    @Test
    @DisplayName("Retorna 409 quando o e-mail já está cadastrado, ignorando maiúsculas e minúsculas")
    void returnsConflict_whenEmailAlreadyExists() throws Exception {
        saveUser("maria@test.com", UserProfile.READER);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson("MARIA@test.com", "Senha@123", "PROFESSOR", null)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Recurso já cadastrado"));

        assertEquals(1, userRepository.count());
    }

    @Test
    @DisplayName("Retorna 404 quando o curso não existe")
    void returnsNotFound_whenCourseDoesNotExist() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson("maria@test.com", "Senha@123", "STUDENT", 999_999)))
                .andExpect(status().isNotFound());

        assertEquals(0, userRepository.count());
    }

    @Test
    @DisplayName("Retorna 400 quando o aluno não informa o curso")
    void returnsBadRequest_whenStudentHasNoCourse() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson("maria@test.com", "Senha@123", "STUDENT", null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("courseId"));

        assertEquals(0, userRepository.count());
    }

    @Test
    @DisplayName("Retorna 400 quando um não aluno informa o curso")
    void returnsBadRequest_whenNonStudentHasCourse() throws Exception {
        Course course = saveCourse("Logística");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson("joao@test.com", "Senha@123", "PROFESSOR", course.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("courseId"));
    }

    @Test
    @DisplayName("Retorna 400 quando a senha tem menos de 8 caracteres")
    void returnsBadRequest_whenPasswordIsTooShort() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson("maria@test.com", "curta", "PROFESSOR", null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("password"));
    }

    @Test
    @DisplayName("Retorna 400 quando o telefone é inválido")
    void returnsBadRequest_whenPhoneIsInvalid() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name": "Maria", "email": "maria@test.com", "password": "Senha@123",
                             "phone": "123", "affiliationType": "PROFESSOR"}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("phone"));
    }

    @Test
    @DisplayName("Retorna 400 com todos os campos obrigatórios ausentes")
    void returnsBadRequest_whenRequiredFieldsAreMissing() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.length()").value(4))
                .andExpect(jsonPath("$.errors[0].field").value("affiliationType"))
                .andExpect(jsonPath("$.errors[1].field").value("email"))
                .andExpect(jsonPath("$.errors[2].field").value("name"))
                .andExpect(jsonPath("$.errors[3].field").value("password"));
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

    private Course saveCourse(String name) {
        Course course = new Course();
        course.setName(name);
        return courseRepository.save(course);
    }

    private String registerJson(String email, String password, String affiliationType, Integer courseId) {
        String course = courseId == null ? "" : ", \"courseId\": " + courseId;
        return """
            {"name": "Maria Silva", "email": "%s", "password": "%s", "affiliationType": "%s"%s}"""
                .formatted(email, password, affiliationType, course);
    }
}