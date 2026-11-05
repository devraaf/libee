package br.edu.fatec.libee.backend.config;

import br.edu.fatec.libee.backend.entity.User;
import br.edu.fatec.libee.backend.enums.UserProfile;
import br.edu.fatec.libee.backend.service.TokenService;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
@Testcontainers
public class SecurityConfigIT {
    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16");

    @Autowired MockMvc mockMvc;
    @Autowired TokenService tokenService;
    @Autowired JwtEncoder jwtEncoder;

    // Sem @WithMockUser de propósito: esta classe testa a autenticação real

    // TESTES DE ROTA PROTEGIDA - token ausente, inválido, de outro segredo e expirado
    @Test
    @DisplayName("Retorna 401 quando o token não é enviado")
    void returnsUnauthorized_whenTokenIsMissing() throws Exception {
        mockMvc.perform(get("/categories"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Não autenticado"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @DisplayName("Retorna 401 quando o token está malformado")
    void returnsUnauthorized_whenTokenIsMalformed() throws Exception {
        mockMvc.perform(get("/categories").header("Authorization", "Bearer token.invalido.aqui"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.title").value("Não autenticado"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @DisplayName("Retorna 401 quando o token foi assinado com outro segredo")
    void returnsUnauthorized_whenTokenIsSignedWithAnotherSecret() throws Exception {
        SecretKey otherKey = new SecretKeySpec(
                "outro-segredo-diferente-com-mais-de-32-bytes".getBytes(StandardCharsets.UTF_8),
                "HmacSHA256");
        JwtEncoder otherEncoder = new NimbusJwtEncoder(new ImmutableSecret<>(otherKey));

        mockMvc.perform(get("/categories")
                        .header("Authorization", "Bearer " + encode(otherEncoder, Instant.now().plusSeconds(3600))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Retorna 401 quando o token está expirado")
    void returnsUnauthorized_whenTokenIsExpired() throws Exception {
        // Expirou há 1 hora, bem além da tolerância de relógio do decoder
        String expired = encode(jwtEncoder, Instant.now().minus(Duration.ofHours(1)));

        mockMvc.perform(get("/categories").header("Authorization", "Bearer " + expired))
                .andExpect(status().isUnauthorized());
    }

    // TESTES DE ACESSO PERMITIDO
    @Test
    @DisplayName("Permite o acesso quando o token é válido")
    void allowsAccess_whenTokenIsValid() throws Exception {
        User user = new User();
        user.setId(1);
        user.setProfile(UserProfile.READER);

        mockMvc.perform(get("/categories")
                        .header("Authorization", "Bearer " + tokenService.generate(user)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Permite o acesso a rota pública sem token")
    void allowsAccess_whenRouteIsPublicAndTokenIsMissing() throws Exception {
        mockMvc.perform(get("/courses"))
                .andExpect(status().isOk());
    }

    private String encode(JwtEncoder encoder, Instant expiresAt) {
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuedAt(expiresAt.minusSeconds(60))
                .expiresAt(expiresAt)
                .subject("1")
                .claim("profile", "READER")
                .build();
        return encoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
