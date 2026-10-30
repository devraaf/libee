package br.edu.fatec.libee.backend.client.book.openlibrary;

import br.edu.fatec.libee.backend.client.book.BookMetadata;
import br.edu.fatec.libee.backend.client.book.BookMetadataProvider;
import br.edu.fatec.libee.backend.exception.ExternalServiceException;
import br.edu.fatec.libee.backend.util.PublicationYearParser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@Order(2)
public class OpenLibraryClient implements BookMetadataProvider {

    @Override
    public String name() {
        return "Open Library";
    }

    private final RestClient restClient;

    public OpenLibraryClient(@Qualifier("openLibraryRestClient") RestClient restClient) {
        this.restClient = restClient;
    }
    
    @Override
    public Optional<BookMetadata> findByIsbn(String isbn) {
        return Optional.ofNullable(fetch(isbn))
                .map(this::toMetadata);
    }

    private OpenLibraryResponse fetch(String isbn) {
        String key = "ISBN:" + isbn;
        try {
            Map<String, OpenLibraryResponse> body = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/books")
                            .queryParam("bibkeys", key)
                            .queryParam("format", "json")
                            .queryParam("jscmd", "data")
                            .build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, OpenLibraryResponse>>() {});
            return body == null ? null : body.get(key);
        }catch (RestClientResponseException e){
            log.warn("Open Library respondeu {}", e.getStatusCode());
            throw new ExternalServiceException("Open Library indisponível");
        }catch (RestClientException e){
            log.warn("Falha ao consultar Open Library: {}", e.getClass().getSimpleName());
            throw new ExternalServiceException("Open Library indisponível");
        }
    }

    private BookMetadata toMetadata(OpenLibraryResponse info) {
        return new BookMetadata(
                info.title(),
                names(info.authors()),
                firstName(info.publishers()),
                PublicationYearParser.parse(info.publishDate()).orElse(null),
                info.numberOfPages(),
                names(info.subjects()).stream().limit(3).toList(),
                firstName(info.publishPlaces()),
                null,
                null,
                coverUrl(info.cover())
        );
    }

    private String coverUrl(OpenLibraryResponse.Cover cover) {
        if (cover == null){
            return null;
        }
        return cover.large() != null ? cover.large() : cover.medium();
    }

    private String firstName(List<OpenLibraryResponse.Named> list) {
        return (list == null || list.isEmpty()) ? null : list.getFirst().name();
    }

    private List<String> names(List<OpenLibraryResponse.Named> list) {
        if (list == null){
            return List.of();
        }
        return list.stream().map(OpenLibraryResponse.Named::name).toList();
    }

}
