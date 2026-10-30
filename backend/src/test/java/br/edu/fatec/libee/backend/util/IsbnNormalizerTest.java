package br.edu.fatec.libee.backend.util;

import br.edu.fatec.libee.backend.exception.InvalidIsbnException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class IsbnNormalizerTest {
    @ParameterizedTest
    @CsvSource({
            "978-0-14-032872-1, 9780140328721",
            "'978 0 14 032872 1', 9780140328721",
            "0-306-40615-2, 0306406152",
            "080442957x, 080442957X"
    })
    @DisplayName("Deve normalizar o ISBN")
    void shouldNormalizeValidIsbn(String input, String expected) {
        assertEquals(expected, IsbnNormalizer.normalize(input));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   ", "abc", "12345", "978014032872", "97801403287211"})
    @DisplayName("Deve lançar exceção de ISBN inválido")
    void shouldRejectInvalidIsbn(String input) {
        assertThrows(InvalidIsbnException.class, () -> IsbnNormalizer.normalize(input));
    }

    @Test
    @DisplayName("Deve lançar exceção de ISBN vazio")
    void shouldRejectNull() {
        assertThrows(InvalidIsbnException.class, () -> IsbnNormalizer.normalize(null));
    }
}
