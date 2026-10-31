package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.dto.request.CopyRequest;
import br.edu.fatec.libee.backend.dto.request.RegisterBookRequest;
import br.edu.fatec.libee.backend.entity.Author;
import br.edu.fatec.libee.backend.entity.Book;
import br.edu.fatec.libee.backend.entity.Category;
import br.edu.fatec.libee.backend.entity.Copy;
import br.edu.fatec.libee.backend.enums.CopyStatus;
import br.edu.fatec.libee.backend.exception.AccessionNumberAlreadyRegisteredException;
import br.edu.fatec.libee.backend.exception.BookAlreadyRegisteredException;
import br.edu.fatec.libee.backend.exception.BusinessRuleException;
import br.edu.fatec.libee.backend.exception.InvalidIsbnException;
import br.edu.fatec.libee.backend.repository.AuthorRepository;
import br.edu.fatec.libee.backend.repository.BookRepository;
import br.edu.fatec.libee.backend.repository.CategoryRepository;
import br.edu.fatec.libee.backend.repository.CopyRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookRegistrationServiceTest {

    private static final String ISBN = "9780140328721";

    @Mock private BookRepository bookRepository;
    @Mock private CopyRepository copyRepository;
    @Mock private AuthorRepository authorRepository;
    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private BookService service;

    @Captor private ArgumentCaptor<Book> bookCaptor;
    @Captor private ArgumentCaptor<List<Copy>> copiesCaptor;
    @Captor
    private ArgumentCaptor<List<Author>> newAuthorsCaptor;

    // ---------- apoio ----------

    private RegisterBookRequest request(String isbn, List<String> authors, CopyRequest... copies) {
        return new RegisterBookRequest("Fantastic Mr. Fox", authors, 1, isbn,
                null, "Puffin", "London", null, 1988, 96, null, List.of(copies));
    }

    private CopyRequest copy(String accessionNumber) {
        return new CopyRequest(accessionNumber, "Estante A1");
    }

    private void givenCategoryExists() {
        when(categoryRepository.findById(1)).thenReturn(Optional.of(new Category()));
    }

    private void givenSaveAssignsId(int id) {
        when(bookRepository.saveAndFlush(any(Book.class))).thenAnswer(invocation -> {
            Book book = invocation.getArgument(0);
            book.setId(id);
            return book;
        });
    }

    private List<String> names(Collection<Author> authors) {
        return authors.stream().map(Author::getName).toList();
    }

    // ---------- sucesso ----------

    @Test
    @DisplayName("Deve cadastrar o livro com exemplares AVAILABLE, tombos sem espaços e ISBN normalizado")
    void shouldRegisterBookWithAvailableCopies() {
        givenCategoryExists();
        givenSaveAssignsId(10);

        Integer id = service.register(request("080442957x", List.of("Roald Dahl"), copy(" 0001 "), copy("0002")));

        assertEquals(10, id);

        verify(bookRepository).saveAndFlush(bookCaptor.capture());
        Book book = bookCaptor.getValue();
        assertEquals("080442957X", book.getIsbn());
        assertEquals("Fantastic Mr. Fox", book.getTitle());

        verify(copyRepository).saveAllAndFlush(copiesCaptor.capture());
        List<Copy> copies = copiesCaptor.getValue();
        assertEquals(List.of("0001", "0002"), copies.stream().map(Copy::getAccessionNumber).toList());
        assertTrue(copies.stream().allMatch(c -> c.getStatus() == CopyStatus.AVAILABLE));
        assertTrue(copies.stream().allMatch(c -> c.getBook() == book));
    }

    @Test
    @DisplayName("Deve cadastrar sem autores e gravar null nos textos opcionais em branco")
    void shouldRegisterWithoutAuthorsAndStoreNullForBlankOptionals() {
        givenCategoryExists();
        givenSaveAssignsId(10);
        RegisterBookRequest request = new RegisterBookRequest("  Fantastic Mr. Fox  ", List.of(), 1, ISBN,
                "  ", "   ", "", null, null, null, "  ", List.of(copy("0001")));

        service.register(request);

        verify(bookRepository).saveAndFlush(bookCaptor.capture());
        Book book = bookCaptor.getValue();
        assertEquals("Fantastic Mr. Fox", book.getTitle());
        assertNull(book.getCoverImageUrl());
        assertNull(book.getPublisher());
        assertNull(book.getPublicationPlace());
        assertNull(book.getSummary());
        assertTrue(book.getAuthors().isEmpty());
        verifyNoInteractions(authorRepository);
    }

    // ---------- autores ----------

    @Test
    @DisplayName("Deve reaproveitar autor existente (ignorando maiúsculas) e criar só os novos")
    void shouldReuseExistingAuthorsAndCreateOnlyNewOnes() {
        givenCategoryExists();
        givenSaveAssignsId(10);
        Author dahl = new Author();
        dahl.setName("Roald Dahl");
        when(authorRepository.findByLowerNameIn(any())).thenReturn(List.of(dahl));

        service.register(request(ISBN, List.of("roald dahl", "Quentin Blake"), copy("0001")));

        verify(authorRepository).saveAll(newAuthorsCaptor.capture());
        assertEquals(List.of("Quentin Blake"), names(newAuthorsCaptor.getValue()));

        verify(bookRepository).saveAndFlush(bookCaptor.capture());
        assertEquals(List.of("Roald Dahl", "Quentin Blake"), names(bookCaptor.getValue().getAuthors()));
    }

    @Test
    @DisplayName("Deve criar um autor só quando o mesmo nome vem repetido com outras maiúsculas e espaços")
    void shouldCreateSingleAuthorForRepeatedNames() {
        givenCategoryExists();
        givenSaveAssignsId(10);

        service.register(request(ISBN, List.of("Roald Dahl", " roald   dahl "), copy("0001")));

        verify(authorRepository).saveAll(newAuthorsCaptor.capture());
        assertEquals(List.of("Roald Dahl"), names(newAuthorsCaptor.getValue()));
        verify(bookRepository).saveAndFlush(bookCaptor.capture());
        assertEquals(1, bookCaptor.getValue().getAuthors().size());
    }

    // ---------- conflitos e erros (nada deve ser gravado) ----------

    @Test
    @DisplayName("Deve lançar BookAlreadyRegisteredException com o id quando o ISBN já está cadastrado")
    void shouldThrowWhenIsbnAlreadyRegistered() {
        Book existing = new Book();
        existing.setId(42);
        when(bookRepository.findByIsbn(ISBN)).thenReturn(Optional.of(existing));

        BookAlreadyRegisteredException exception = assertThrows(BookAlreadyRegisteredException.class,
                () -> service.register(request(ISBN, List.of(), copy("0001"))));

        assertEquals(42, exception.getBookId());
        verify(bookRepository, never()).saveAndFlush(any());
        verifyNoInteractions(copyRepository, authorRepository, categoryRepository);
    }

    @Test
    @DisplayName("Deve lançar AccessionNumberAlreadyRegisteredException quando o tombo já existe no banco")
    void shouldThrowWhenAccessionNumberExistsInDatabase() {
        when(copyRepository.findExistingAccessionNumbers(any())).thenReturn(List.of("0002"));

        AccessionNumberAlreadyRegisteredException exception = assertThrows(
                AccessionNumberAlreadyRegisteredException.class,
                () -> service.register(request(ISBN, List.of(), copy("0001"), copy("0002"))));

        assertEquals(List.of("0002"), exception.getAccessionNumbers());
        verify(bookRepository, never()).saveAndFlush(any());
        verifyNoInteractions(categoryRepository, authorRepository);
    }

    @Test
    @DisplayName("Deve lançar AccessionNumberAlreadyRegisteredException quando o tombo se repete na requisição")
    void shouldThrowWhenAccessionNumberRepeatsInRequest() {
        AccessionNumberAlreadyRegisteredException exception = assertThrows(
                AccessionNumberAlreadyRegisteredException.class,
                () -> service.register(request(ISBN, List.of(), copy("0001"), copy(" 0001 "))));

        assertEquals(List.of("0001"), exception.getAccessionNumbers());
        verify(bookRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("Deve lançar BusinessRuleException quando a categoria não existe")
    void shouldThrowWhenCategoryDoesNotExist() {
        BusinessRuleException exception = assertThrows(BusinessRuleException.class,
                () -> service.register(request(ISBN, List.of("Roald Dahl"), copy("0001"))));

        assertEquals("Categoria não encontrada.", exception.getMessage());
        verify(bookRepository, never()).saveAndFlush(any());
        verifyNoInteractions(authorRepository);   // nenhum autor é criado se a categoria falha
    }

    @Test
    @DisplayName("Deve lançar InvalidIsbnException sem consultar nada quando o ISBN é inválido")
    void shouldThrowWhenIsbnIsInvalid() {
        assertThrows(InvalidIsbnException.class,
                () -> service.register(request("abc", List.of(), copy("0001"))));

        verifyNoInteractions(bookRepository, copyRepository, authorRepository, categoryRepository);
    }
}
