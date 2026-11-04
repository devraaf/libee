package br.edu.fatec.libee.backend.request;

import br.edu.fatec.libee.backend.dto.request.CopyRequest;
import br.edu.fatec.libee.backend.dto.request.RegisterBookRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;


class RegisterBookRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    private RegisterBookRequest request(String isbn, List<String> authors, List<CopyRequest> copies) {
        return new RegisterBookRequest("Fantastic Mr. Fox", authors, 1, isbn,
                null, "Puffin", "London", null, 1988, 96, null, copies);
    }

    private Set<String> invalidPaths(RegisterBookRequest request) {
        return validator.validate(request).stream()
                .map(violation -> violation.getPropertyPath().toString())
                .collect(Collectors.toSet());
    }

    private final List<CopyRequest> validCopies = List.of(new CopyRequest("0001", "Estante A1"));

    @Test
    @DisplayName("Deve aceitar uma requisição válida")
    void shouldAcceptValidRequest() {
        assertTrue(invalidPaths(request("9780140328721", List.of("Roald Dahl"), validCopies)).isEmpty());
    }

    @Test
    @DisplayName("Deve aceitar requisição sem autores (null vira lista vazia)")
    void shouldAcceptMissingAuthors() {
        RegisterBookRequest request = request("9780140328721", null, validCopies);

        assertEquals(List.of(), request.authors());
        assertTrue(invalidPaths(request).isEmpty());
    }

    @Test
    @DisplayName("Deve rejeitar requisição sem exemplares")
    void shouldRejectEmptyCopies() {
        assertEquals(Set.of("copies"), invalidPaths(request("9780140328721", List.of(), List.of())));
    }

    @Test
    @DisplayName("Deve apontar o campo do exemplar sem tombo")
    void shouldPointToCopyWithoutAccessionNumber() {
        List<CopyRequest> copies = List.of(new CopyRequest(" ", "Estante A1"));

        assertEquals(Set.of("copies[0].accessionNumber"),
                invalidPaths(request("9780140328721", List.of(), copies)));
    }

    @ParameterizedTest
    @ValueSource(strings = {"978-0-14-032872-1", "123", "abcdefghij", "978014032872"})
    @DisplayName("Deve rejeitar ISBN fora do formato")
    void shouldRejectInvalidIsbn(String isbn) {
        assertEquals(Set.of("isbn"), invalidPaths(request(isbn, List.of(), validCopies)));
    }
}
