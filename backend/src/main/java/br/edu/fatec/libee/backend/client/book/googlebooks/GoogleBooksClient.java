package br.edu.fatec.libee.backend.client.book.googlebooks;

import br.edu.fatec.libee.backend.client.book.BookMetadata;
import br.edu.fatec.libee.backend.client.book.BookMetadataProvider;
import br.edu.fatec.libee.backend.exception.ExternalServiceException;
import br.edu.fatec.libee.backend.util.PublicationYearParser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@Order(1)
public class GoogleBooksClient implements BookMetadataProvider {
    @Override
    public String name() {
        return "Google Books";
    }

    private final RestClient restClient;
    private final GoogleBooksProperties properties;

    public GoogleBooksClient(@Qualifier("googleBooksRestClient") RestClient restClient,
                             GoogleBooksProperties properties) {
        this.restClient = restClient;
        this.properties = properties;
    }

    @Override
    public Optional<BookMetadata> findByIsbn(String isbn) {
        GoogleBooksResponse response = fetch(isbn);

        return Optional.ofNullable(response)
                .map(GoogleBooksResponse::items)
                .filter(items -> !items.isEmpty())
                .map(items -> items.getFirst().volumeInfo())
                .map(this::toMetadata);
    }

    private GoogleBooksResponse fetch(String isbn) {
        try {
            return restClient.get()
                    .uri(uriBuilder -> {
                        uriBuilder.path("/volumes").queryParam("q", "isbn:" + isbn);
                        if (StringUtils.hasText(properties.apiKey())) {
                            uriBuilder.queryParam("key", properties.apiKey());
                        }
                        return uriBuilder.build();
                    })
                    .retrieve()
                    .body(GoogleBooksResponse.class);
        } catch (RestClientResponseException e) {
            log.warn("Google Books respondeu {}", e.getStatusCode());
            throw new ExternalServiceException("Google Books indisponível");
        } catch (RestClientException e) {
            log.warn("Falha ao consultar Google Books: {}", e.getClass().getSimpleName());
            throw new ExternalServiceException("Google Books indisponível");
        }
    }

    private BookMetadata toMetadata(GoogleBooksResponse.VolumeInfo info) {
        return new BookMetadata(
                info.title(),
                info.authors() != null ? info.authors() : List.of(),
                info.publisher(),
                PublicationYearParser.parse(info.publishedDate()).orElse(null),
                info.pageCount(),
                info.categories() != null ? info.categories() : List.of(),
                null,   // place: a Google não informa
                null,   // edition: a Google não informa
                info.description(),
                coverUrl(info.imageLinks())
        );
    }

    private String coverUrl(GoogleBooksResponse.ImageLinks links) {
        if (links == null || links.thumbnail() == null) {
            return null;
        }
        return links.thumbnail().replaceFirst("^http://", "https://");
    }
}
