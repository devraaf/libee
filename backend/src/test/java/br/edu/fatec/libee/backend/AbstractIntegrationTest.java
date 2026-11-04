package br.edu.fatec.libee.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
@Import(TestData.class)
public abstract class AbstractIntegrationTest {

    @ServiceConnection
    static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16");

    static {
        postgres.start();
    }

    @Autowired protected MockMvc mockMvc;
    @Autowired protected JdbcTemplate jdbcTemplate;
    @Autowired protected TestData testData;

    // Esvazia as tabelas para o teste não depender de dados pré-existentes
    protected void truncate(String... tables) {
        jdbcTemplate.execute("TRUNCATE TABLE " + String.join(", ", tables) + " RESTART IDENTITY CASCADE");
    }

    protected MockHttpServletRequestBuilder postJson(String path, String body) {
        return post(path).contentType(MediaType.APPLICATION_JSON).content(body);
    }

    protected RequestPostProcessor asReader(Integer userId) {
        return asUser(userId, "READER");
    }

    protected RequestPostProcessor asLibrarian(Integer userId) {
        return asUser(userId, "LIBRARIAN");
    }

    private RequestPostProcessor asUser(Integer userId, String role) {
        return jwt()
                .jwt(token -> token.subject(String.valueOf(userId)).claim("profile", role))
                .authorities(new SimpleGrantedAuthority("ROLE_" + role));
    }
}
