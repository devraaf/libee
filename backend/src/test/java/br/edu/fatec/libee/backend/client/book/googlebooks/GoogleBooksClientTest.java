package br.edu.fatec.libee.backend.client.book.googlebooks;

import br.edu.fatec.libee.backend.client.book.BookMetadata;
import br.edu.fatec.libee.backend.exception.ExternalServiceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class GoogleBooksClientTest {

    private static final String BASE_URL = "https://test.local/books/v1";
    private static final String ISBN = "9780140328721";

    private MockRestServiceServer server;
    private RestClient restClient;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl(BASE_URL);
        server = MockRestServiceServer.bindTo(builder).build();
        restClient = builder.build();
    }

    private GoogleBooksClient clientWithKey(String apiKey) {
        return new GoogleBooksClient(restClient,
                new GoogleBooksProperties(BASE_URL, apiKey, Duration.ofSeconds(1), Duration.ofSeconds(1)));
    }

    private String fixture(String name) throws IOException {
        return new ClassPathResource("fixtures/google-books/" + name)
                .getContentAsString(StandardCharsets.UTF_8);
    }

    @Test
    @DisplayName("Deve mapear os dados do livro quando a API encontra o ISBN")
    void shouldMapBookWhenFound() throws IOException {
        server.expect(requestTo(containsString("q=isbn:" + ISBN)))
                .andRespond(withSuccess(fixture("found.json"), MediaType.APPLICATION_JSON));

        Optional<BookMetadata> result = clientWithKey("").findByIsbn(ISBN);

        assertTrue(result.isPresent());
        BookMetadata book = result.get();
        assertEquals("Título de exemplo", book.title());
        assertEquals(List.of("Autor Um", "Autor Dois"), book.authors());
        assertEquals(2008, book.publicationYear());
        assertTrue(book.coverUrl().startsWith("https://"));
        server.verify();
    }

    @Test
    @DisplayName("Deve retornar vazio quando a API responde sem resultados")
    void shouldReturnEmptyWhenNoItemsFound() throws IOException {
        server.expect(requestTo(containsString("q=isbn:" + ISBN)))
                .andRespond(withSuccess(fixture("empty.json"), MediaType.APPLICATION_JSON));

        Optional<BookMetadata> result = clientWithKey("").findByIsbn(ISBN);

        assertTrue(result.isEmpty());
        server.verify();
    }

    @Test
    @DisplayName("Deve lançar ExternalServiceException quando a cota é excedida (429)")
    void shouldThrowExternalServiceExceptionWhenQuotaExceeded(){
        server.expect(requestTo(containsString("q=isbn:" + ISBN)))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));

        assertThrows(ExternalServiceException.class, () -> clientWithKey("").findByIsbn(ISBN));
        server.verify();
    }

    @Test
    @DisplayName("Deve lançar ExternalServiceException quando a API responde com erro de servidor (500)")
    void shouldThrowExternalServiceExceptionWhenGoogleIsDown(){
        server.expect(requestTo(containsString("q=isbn:" + ISBN)))
                .andRespond(withServerError());

        assertThrows(ExternalServiceException.class, () -> clientWithKey("").findByIsbn(ISBN));
        server.verify();
    }

    @Test
    @DisplayName("Não deve enviar o parâmetro key quando a chave de API está vazia")
    void shouldNotSendKeyParamWhenApiKeyIsBlank() throws IOException {
        server.expect(requestTo(not(containsString("key="))))
                .andRespond(withSuccess(fixture("empty.json"), MediaType.APPLICATION_JSON));

        clientWithKey("").findByIsbn(ISBN);
        server.verify();
    }

    @Test
    @DisplayName("Deve enviar o parâmetro key quando a chave de API está configurada")
    void shouldSendKeyParamWhenApiKeyIsConfigured() throws IOException {
        server.expect(requestTo(containsString("key=abc")))
                .andRespond(withSuccess(fixture("empty.json"), MediaType.APPLICATION_JSON));

        clientWithKey("abc").findByIsbn(ISBN);
        server.verify();
    }
}
