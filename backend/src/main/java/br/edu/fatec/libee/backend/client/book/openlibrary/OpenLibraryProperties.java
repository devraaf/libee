package br.edu.fatec.libee.backend.client.book.openlibrary;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "libee.integrations.open-library")
public record OpenLibraryProperties(
        String baseUrl,
        Duration connectTimeout,
        Duration readTimeout
) {
}
