package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.client.book.BookMetadata;
import br.edu.fatec.libee.backend.client.book.BookMetadataProvider;
import br.edu.fatec.libee.backend.entity.Book;
import br.edu.fatec.libee.backend.exception.BookAlreadyRegisteredException;
import br.edu.fatec.libee.backend.exception.ExternalServiceException;
import br.edu.fatec.libee.backend.exception.InvalidIsbnException;
import br.edu.fatec.libee.backend.exception.ResourceNotFoundException;
import br.edu.fatec.libee.backend.repository.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookLookupServiceTest {

    @Mock BookMetadataProvider google;
    @Mock BookMetadataProvider openLibrary;
    @Mock BookRepository bookRepository;

    private static final String ISBN = "9780140328721";

    private BookLookupService service;

    @BeforeEach
    void setUp() {
        service = new BookLookupService(bookRepository, List.of(google, openLibrary));
        lenient().when(google.name()).thenReturn("Google Books");
        lenient().when(openLibrary.name()).thenReturn("Open Library");
    }
    private BookMetadata metadata(String title) {
        return new BookMetadata(title, List.of("Autor"), "Editora", 2008, 100,
                List.of("Fiction"), null, null, null, null);
    }

    @Test
    @DisplayName("Deve retornar o resultado da Google sem consultar a Open Library quando a Google encontra o livro")
    void shouldReturnGoogleResultWhenGoogleFindsBook() {
        BookMetadata expected = metadata("Da Google");
        when(google.findByIsbn(ISBN)).thenReturn(Optional.of(expected));

        BookMetadata result = service.lookupByIsbn(ISBN);

        assertSame(expected, result);
        verify(openLibrary, never()).findByIsbn(any());
    }

    @Test
    @DisplayName("Deve consultar a Open Library quando a Google responde sem resultado")
    void shouldFallbackToOpenLibraryWhenGoogleReturnsEmpty() {
        BookMetadata expected = metadata("Da Open Library");
        when(google.findByIsbn(ISBN)).thenReturn(Optional.empty());
        when(openLibrary.findByIsbn(ISBN)).thenReturn(Optional.of(expected));

        BookMetadata result = service.lookupByIsbn(ISBN);

        assertSame(expected, result);
    }

    @Test
    @DisplayName("Deve consultar a Open Library quando a Google falha")
    void shouldFallbackToOpenLibraryWhenGoogleFails() {
        BookMetadata expected = metadata("Da Open Library");
        when(google.findByIsbn(ISBN)).thenThrow(new ExternalServiceException("Google Books indisponível"));
        when(openLibrary.findByIsbn(ISBN)).thenReturn(Optional.of(expected));

        BookMetadata result = service.lookupByIsbn(ISBN);

        assertSame(expected, result);
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando nenhuma API conhece o ISBN")
    void shouldThrowNotFoundWhenNoProviderKnowsIsbn() {
        when(google.findByIsbn(ISBN)).thenReturn(Optional.empty());
        when(openLibrary.findByIsbn(ISBN)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.lookupByIsbn(ISBN));
    }

    @Test
    @DisplayName("Deve lançar ExternalServiceException, e não 404, quando uma API falha e a outra não encontra")
    void shouldThrowExternalServiceWhenOneProviderFailsAndOtherFindsNothing() {
        when(google.findByIsbn(ISBN)).thenThrow(new ExternalServiceException("Google Books indisponível"));
        when(openLibrary.findByIsbn(ISBN)).thenReturn(Optional.empty());

        assertThrows(ExternalServiceException.class, () -> service.lookupByIsbn(ISBN));
    }

    @Test
    @DisplayName("Deve lançar ExternalServiceException quando todas as APIs falham")
    void shouldThrowExternalServiceWhenAllProvidersFail() {
        when(google.findByIsbn(ISBN)).thenThrow(new ExternalServiceException("Google Books indisponível"));
        when(openLibrary.findByIsbn(ISBN)).thenThrow(new ExternalServiceException("Open Library indisponível"));

        assertThrows(ExternalServiceException.class, () -> service.lookupByIsbn(ISBN));
    }

    @Test
    @DisplayName("Deve lançar BookAlreadyRegisteredException com o id do livro, sem chamar nenhuma API, quando o ISBN já está cadastrado")
    void shouldThrowAlreadyRegisteredWithoutCallingProvidersWhenIsbnExists() {
        Book existing = mock(Book.class);
        when(existing.getId()).thenReturn(42);
        when(bookRepository.findByIsbn(ISBN)).thenReturn(Optional.of(existing));

        BookAlreadyRegisteredException exception = assertThrows(
                BookAlreadyRegisteredException.class, () -> service.lookupByIsbn(ISBN));

        assertEquals(Integer.valueOf(42), exception.getBookId());
        verifyNoInteractions(google, openLibrary);
    }

    @Test
    @DisplayName("Deve lançar InvalidIsbnException sem consultar o banco nem as APIs quando o ISBN é inválido")
    void shouldThrowInvalidIsbnWithoutTouchingRepositoryOrProviders() {
        assertThrows(InvalidIsbnException.class, () -> service.lookupByIsbn("abc"));

        verifyNoInteractions(bookRepository, google, openLibrary);
    }

    @Test
    @DisplayName("Deve normalizar o ISBN antes de consultar o banco e as APIs")
    void shouldNormalizeIsbnBeforeQuerying() {
        BookMetadata expected = metadata("Da Google");
        when(google.findByIsbn(ISBN)).thenReturn(Optional.of(expected));

        service.lookupByIsbn("978-0-14-032872-1");

        verify(bookRepository).findByIsbn(ISBN);
        verify(google).findByIsbn(ISBN);
    }
}
