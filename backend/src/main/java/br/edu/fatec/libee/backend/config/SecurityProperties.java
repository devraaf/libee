package br.edu.fatec.libee.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

@ConfigurationProperties(prefix = "app.security")
public record SecurityProperties(Jwt jwt, Cors cors) {
    public record Jwt(String secret, Duration expiration) {}
    public record Cors(List<String> allowedOrigins) {}
}
