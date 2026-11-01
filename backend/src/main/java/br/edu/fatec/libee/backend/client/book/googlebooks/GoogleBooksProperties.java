package br.edu.fatec.libee.backend.client.book.googlebooks;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "libee.integrations.google-books")
public record GoogleBooksProperties(
        String baseUrl,
        String apiKey,
        Duration connectTimeout,
        Duration readTimeout
) {
}
