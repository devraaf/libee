package br.edu.fatec.libee.backend.client.book.openlibrary;

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
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class OpenLibraryClientTest {
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

    private OpenLibraryClient client() {
        return new OpenLibraryClient(restClient);
    }

    private String fixture(String name) throws IOException{
        return new ClassPathResource("fixtures/open-library/" + name)
                .getContentAsString(StandardCharsets.UTF_8);
    }

    @Test
    @DisplayName("Deve mapear os dados do livro quando a API encontra o ISBN")
    void shouldMapBookWhenFound()throws IOException{
        server.expect(requestTo(containsString("bibkeys=ISBN:" + ISBN)))
                .andRespond(withSuccess(fixture("found.json"), MediaType.APPLICATION_JSON));

        Optional<BookMetadata> result = client().findByIsbn(ISBN);

        assertTrue(result.isPresent());
        BookMetadata book = result.get();
        assertEquals("Fantastic Mr. Fox", book.title());
        assertEquals(List.of("Roald Dahl"), book.authors());
        assertEquals(1988, book.publicationYear());
        assertEquals("Puffin", book.publisher());
        assertEquals("London", book.place());
        assertEquals(96, book.pageCount());
        assertEquals(List.of("Animals", "Juvenile fiction", "Fiction"), book.categorySuggestions());
        assertTrue(book.categorySuggestions().size() == 3);
        assertEquals("https://covers.openlibrary.org/b/id/15152634-L.jpg", book.coverUrl());
        server.verify();
    }

    @Test
    @DisplayName("Deve retornar vazio quando a API responde sem resultados")
    void shouldReturnEmptyWhenNoItemsFound() throws IOException {
        server.expect(requestTo(containsString("bibkeys=ISBN:" + ISBN)))
                .andRespond(withSuccess(fixture("empty.json"), MediaType.APPLICATION_JSON));

        Optional<BookMetadata> result = client().findByIsbn(ISBN);

        assertTrue(result.isEmpty());
        server.verify();
    }

    @Test
    @DisplayName("Deve lançar ExternalServiceException quando a cota é excedida (429)")
    void shouldThrowExternalServiceExceptionWhenQuotaExceeded(){
        server.expect(requestTo(containsString("bibkeys=ISBN:" + ISBN)))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));

        assertThrows(ExternalServiceException.class, () -> client().findByIsbn(ISBN));
        server.verify();
    }

    @Test
    @DisplayName("Deve lançar ExternalServiceException quando a API responde com erro de servidor (500)")
    void shouldThrowExternalServiceExceptionWhenGoogleIsDown(){
        server.expect(requestTo(containsString("bibkeys=ISBN:" + ISBN)))
                .andRespond(withServerError());

        assertThrows(ExternalServiceException.class, () -> client().findByIsbn(ISBN));
        server.verify();
    }

    @Test
    @DisplayName("Deve mapear sem erro quando a Open Library não informa os campos opcionais")
    void shouldMapBookWhenOptionalFieldsAreMissing() throws IOException {
        server.expect(requestTo(containsString("bibkeys=ISBN:" + ISBN)))
                .andRespond(withSuccess(fixture("minimal.json"), MediaType.APPLICATION_JSON));

        BookMetadata book = client().findByIsbn(ISBN).orElseThrow();

        assertEquals("Fantastic Mr. Fox", book.title());
        assertEquals(List.of(), book.authors());
        assertNull(book.publisher());
        assertNull(book.publicationYear());
        assertNull(book.place());
        assertEquals(List.of(), book.categorySuggestions());
        assertNull(book.coverUrl());
    }
}
