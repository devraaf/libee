package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.AbstractIntegrationTest;
import br.edu.fatec.libee.backend.client.book.BookMetadata;
import br.edu.fatec.libee.backend.client.book.googlebooks.GoogleBooksClient;
import br.edu.fatec.libee.backend.client.book.openlibrary.OpenLibraryClient;
import br.edu.fatec.libee.backend.entity.Author;
import br.edu.fatec.libee.backend.entity.Book;
import br.edu.fatec.libee.backend.entity.Category;
import br.edu.fatec.libee.backend.entity.Copy;
import br.edu.fatec.libee.backend.enums.CopyStatus;
import br.edu.fatec.libee.backend.exception.ExternalServiceException;
import br.edu.fatec.libee.backend.repository.AuthorRepository;
import br.edu.fatec.libee.backend.repository.BookRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.ResultActions;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WithMockUser(roles = "LIBRARIAN")
public class BookControllerIT extends AbstractIntegrationTest {

    @MockitoBean private GoogleBooksClient googleBooksClient;
    @MockitoBean private OpenLibraryClient openLibraryClient;

    @Autowired BookRepository bookRepository;
    @Autowired AuthorRepository authorRepository;
    @Autowired EntityManager entityManager;

    private static final int NON_EXISTENT_ID = 999_999;
    private static final String NEW_ISBN = "9780000000002";
    private static final String NEW_ACCESSION = "NEW-001";
    private static final String LOOKUP_URL = "/books/management/lookup";
    private static final String LOOKUP_ISBN = "9780140328721";

    private static final String DOM_CASMURRO_ISBN = "9788535911664";   // exemplar 001, AVAILABLE
    private static final String DOM_CASMURRO_ACCESSION = "001";
    private static final String CLEAN_CODE_ISBN = "9780132350884";     // exemplar 002, ON_LOAN
    private static final String CLEAN_CODE_ACCESSION = "002";

    private Category romance;
    private Category tecnologia;
    private Book domCasmurro;
    private Book cleanCode;
    private Copy domCasmurroCopy;
    private Copy cleanCodeCopy;

    @BeforeEach
    void setUp() {
        // Esvazia o catálogo para o teste não depender de dados pré-existentes
        truncate("loans", "book_copies", "book_author", "books", "authors", "categories");

        romance = testData.saveCategory("Romance");
        tecnologia = testData.saveCategory("Tecnologia");

        Author machado = testData.saveAuthor("Machado de Assis");
        Author martin = testData.saveAuthor("Robert C. Martin");

        domCasmurro = testData.saveBook(DOM_CASMURRO_ISBN, "Dom Casmurro", romance, machado);
        cleanCode = testData.saveBook(CLEAN_CODE_ISBN, "Clean Code", tecnologia, martin);

        domCasmurroCopy = testData.saveCopy(domCasmurro, DOM_CASMURRO_ACCESSION, CopyStatus.AVAILABLE);
        cleanCodeCopy = testData.saveCopy(cleanCode, CLEAN_CODE_ACCESSION, CopyStatus.ON_LOAN);
    }

    // TESTES DE GET /books - Lista com paginação e busca de livros (leitor)
    @Test
    @WithMockUser(roles = "READER")
    @DisplayName("Retorna livros paginados quando page e size são informados")
    void returnsPagedBooks_whenPageAndSizeAreProvided() throws Exception {
        mockMvc.perform(get("/books").param("page", "0").param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2));
    }

    @Test
    @WithMockUser(roles = "READER")
    @DisplayName("Retorna o livro correspondente ao buscar por título")
    void returnsMatchingBook_whenSearchingByTitle() throws Exception {
        mockMvc.perform(get("/books").param("q", "casmurro"))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Dom Casmurro"));
    }

    @Test
    @WithMockUser(roles = "READER")
    @DisplayName("Retorna o livro correspondente ao buscar pelo nome do autor")
    void returnsMatchingBook_whenSearchingByAuthorName() throws Exception {
        mockMvc.perform(get("/books").param("q", "martin"))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Clean Code"));
    }

    @Test
    @WithMockUser(roles = "READER")
    @DisplayName("Retorna o livro correspondente quando o ISBN é digitado com hífens")
    void returnsMatchingBook_whenIsbnHasHyphens() throws Exception {
        mockMvc.perform(get("/books").param("q", "978-0-13-235088-4"))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Clean Code"));
    }

    @Test
    @WithMockUser(roles = "READER")
    @DisplayName("Retorna apenas livros da categoria quando categoryId é informado")
    void returnsOnlyBooksOfCategory_whenCategoryIdIsProvided() throws Exception {
        mockMvc.perform(get("/books").param("categoryId", tecnologia.getId().toString()))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].category").value("Tecnologia"));
    }

    @Test
    @WithMockUser(roles = "READER")
    @DisplayName("Retorna lista vazia quando a busca não tem resultado")
    void returnsEmptyList_whenSearchHasNoMatch() throws Exception {
        mockMvc.perform(get("/books").param("q", "zzzzzz"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @WithMockUser(roles = "READER")
    @DisplayName("Marca o livro como disponível quando há exemplar disponível")
    void marksBookAsAvailable_whenItHasAvailableCopy() throws Exception {
        mockMvc.perform(get("/books").param("q", "casmurro"))
                .andExpect(jsonPath("$.content[0].available").value(true));
        mockMvc.perform(get("/books").param("q", "clean code"))
                .andExpect(jsonPath("$.content[0].available").value(false));
    }

    @Test
    @WithMockUser(roles = "READER")
    @DisplayName("Retorna 400 quando size é zero")
    void returnsBadRequest_whenSizeIsZero() throws Exception {
        mockMvc.perform(get("/books").param("size", "0"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "READER")
    @DisplayName("Retorna 400 quando size excede o limite de 100")
    void returnsBadRequest_whenSizeExceedsLimit() throws Exception {
        mockMvc.perform(get("/books").param("size", "101"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "READER")
    @DisplayName("Retorna 400 quando page é negativo")
    void returnsBadRequest_whenPageIsNegative() throws Exception {
        mockMvc.perform(get("/books").param("page", "-1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "READER")
    @DisplayName("Retorna 400 quando categoryId não é numérico")
    void returnsBadRequest_whenCategoryIdIsNotNumeric() throws Exception {
        mockMvc.perform(get("/books").param("categoryId", "abc"))
                .andExpect(status().isBadRequest());
    }

    // TESTES DE GET /books/{id} - Detalhes do livro
    @Test
    @WithMockUser(roles = "READER")
    @DisplayName("Retorna todos os campos do livro, com autores e exemplares ordenados")
    void returnsCompleteDetails_whenBookHasAllFields() throws Exception {
        Author zelia = testData.saveAuthor("Zélia Furtado");
        Author ana = testData.saveAuthor("Ana Beatriz Lima");
        Book book = saveBookWithAllFields(tecnologia, zelia, ana);
        // Salvos fora de ordem de propósito
        testData.saveCopy(book, "0003", CopyStatus.ON_LOAN);
        testData.saveCopy(book, "0001", CopyStatus.AVAILABLE);
        testData.saveCopy(book, "0002", CopyStatus.AVAILABLE);

        mockMvc.perform(get("/books/{id}", book.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(book.getId()))
                .andExpect(jsonPath("$.title").value("Estruturas de Dados em Java"))
                .andExpect(jsonPath("$.category").value("Tecnologia"))
                .andExpect(jsonPath("$.isbn").value("9788500000019"))
                .andExpect(jsonPath("$.coverImageUrl").value("https://example.com/covers/estruturas.jpg"))
                .andExpect(jsonPath("$.publisher").value("Editora Horizonte"))
                .andExpect(jsonPath("$.publicationPlace").value("São Paulo"))
                .andExpect(jsonPath("$.edition").value("2ª edição"))
                .andExpect(jsonPath("$.publicationYear").value(2021))
                .andExpect(jsonPath("$.pageCount").value(480))
                .andExpect(jsonPath("$.summary").value("Introdução a listas, pilhas, filas, árvores e grafos, com exemplos em Java."))
                // autores em ordem alfabética, mesmo salvos ao contrário
                .andExpect(jsonPath("$.authors.length()").value(2))
                .andExpect(jsonPath("$.authors[0].name").value("Ana Beatriz Lima"))
                .andExpect(jsonPath("$.authors[1].name").value("Zélia Furtado"))
                // exemplares em ordem de tombo, mesmo salvos fora de ordem
                .andExpect(jsonPath("$.totalCopies").value(3))
                .andExpect(jsonPath("$.copies.length()").value(3))
                .andExpect(jsonPath("$.copies[0].accessionNumber").value("0001"))
                .andExpect(jsonPath("$.copies[0].physicalLocation").value("A-01"))
                .andExpect(jsonPath("$.copies[0].status").value("AVAILABLE"))
                .andExpect(jsonPath("$.copies[1].accessionNumber").value("0002"))
                .andExpect(jsonPath("$.copies[2].accessionNumber").value("0003"))
                .andExpect(jsonPath("$.copies[2].status").value("ON_LOAN"));
    }

    @Test
    @WithMockUser(roles = "READER")
    @DisplayName("Retorna lista de exemplares vazia e total 0 quando o livro não tem exemplares")
    void returnsEmptyCopies_whenBookHasNoCopies() throws Exception {
        Book book = testData.saveBook("9780306406157", "Livro Sem Exemplares", romance,
                testData.saveAuthor("Autora Teste"));

        mockMvc.perform(get("/books/{id}", book.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.copies.length()").value(0))
                .andExpect(jsonPath("$.totalCopies").value(0));
    }

    @Test
    @WithMockUser(roles = "READER")
    @DisplayName("Retorna 200 com campos opcionais nulos quando o livro só tem os dados obrigatórios")
    void returnsNullOptionalFields_whenBookHasOnlyRequiredData() throws Exception {
        Book book = testData.saveBook("9780306406157", "Livro Mínimo", romance,
                testData.saveAuthor("Autora Teste"));

        mockMvc.perform(get("/books/{id}", book.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Livro Mínimo"))
                .andExpect(jsonPath("$.publisher").value(nullValue()))
                .andExpect(jsonPath("$.publicationPlace").value(nullValue()))
                .andExpect(jsonPath("$.edition").value(nullValue()))
                .andExpect(jsonPath("$.coverImageUrl").value(nullValue()))
                .andExpect(jsonPath("$.publicationYear").value(nullValue()))
                .andExpect(jsonPath("$.pageCount").value(nullValue()))
                .andExpect(jsonPath("$.summary").value(nullValue()));
    }

    @Test
    @WithMockUser(roles = "READER")
    @DisplayName("Retorna 404 em formato ProblemDetail quando o id não existe")
    void returnsNotFound_whenIdDoesNotExist() throws Exception {
        mockMvc.perform(get("/books/{id}", NON_EXISTENT_ID))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Recurso não encontrado"))
                .andExpect(jsonPath("$.detail").exists())
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @WithMockUser(roles = "READER")
    @DisplayName("Retorna 400 quando o id não é numérico")
    void returnsBadRequest_whenIdIsNotNumeric() throws Exception {
        mockMvc.perform(get("/books/abc"))
                .andExpect(status().isBadRequest());
    }

    // TESTES DE GET /books/management - Acervo do bibliotecário
    @Test
    @DisplayName("Retorna livros com quantidades de exemplares quando o usuário é bibliotecário")
    void returnsBooksWithCopyCounts_whenUserIsLibrarian() throws Exception {
        mockMvc.perform(get("/books/management").param("q", "casmurro"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Dom Casmurro"))
                .andExpect(jsonPath("$.content[0].isbn").value(DOM_CASMURRO_ISBN))
                .andExpect(jsonPath("$.content[0].totalCopies").value(1))
                .andExpect(jsonPath("$.content[0].availableCopies").value(1));
    }

    @Test
    @DisplayName("Retorna zero exemplares disponíveis quando todos estão emprestados")
    void returnsZeroAvailableCopies_whenAllCopiesAreOnLoan() throws Exception {
        mockMvc.perform(get("/books/management").param("q", "clean code"))
                .andExpect(jsonPath("$.content[0].totalCopies").value(1))
                .andExpect(jsonPath("$.content[0].availableCopies").value(0));
    }

    @Test
    @DisplayName("Retorna quantidade 0 quando o livro não tem exemplares")
    void returnsZeroCopies_whenBookHasNoCopies_inManagementList() throws Exception {
        testData.saveBook("9780306406157", "Livro Sem Exemplares", romance,
                testData.saveAuthor("Autora Teste"));

        mockMvc.perform(get("/books/management").param("q", "sem exemplares"))
                .andExpect(jsonPath("$.content[0].totalCopies").value(0))
                .andExpect(jsonPath("$.content[0].availableCopies").value(0));
    }

    // TESTES DE GET /books/management/summary - Resumo do acervo
    @Test
    @DisplayName("Retorna os totais do acervo inteiro com cada campo no seu lugar")
    void returnsCollectionTotals_whenSummaryIsRequested() throws Exception {
        testData.saveCopy(domCasmurro, "003", CopyStatus.AVAILABLE);
        testData.saveCopy(domCasmurro, "004", CopyStatus.AVAILABLE);

        mockMvc.perform(get("/books/management/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBooks").value(2))
                .andExpect(jsonPath("$.totalCopies").value(4))
                .andExpect(jsonPath("$.availableCopies").value(3))
                .andExpect(jsonPath("$.onLoanCopies").value(1));
    }

    @Test
    @DisplayName("Retorna todos os valores zerados quando o acervo está vazio")
    void returnsZeros_whenCollectionIsEmpty() throws Exception {
        truncate("loans", "book_copies", "book_author", "books", "authors", "categories");

        mockMvc.perform(get("/books/management/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBooks").value(0))
                .andExpect(jsonPath("$.totalCopies").value(0))
                .andExpect(jsonPath("$.availableCopies").value(0))
                .andExpect(jsonPath("$.onLoanCopies").value(0));
    }

    @Test
    @DisplayName("Conta livros sem exemplares no total de livros, mas não nos exemplares")
    void countsBookWithoutCopies_inTotalBooksOnly() throws Exception {
        testData.saveBook("9012345678900", "Livro Sem Exemplares", romance,
                testData.saveAuthor("Autora Teste"));

        mockMvc.perform(get("/books/management/summary"))
                .andExpect(jsonPath("$.totalBooks").value(3))
                .andExpect(jsonPath("$.totalCopies").value(2));
    }

    // TESTES DE GET /books/management/lookup - Buscar ISBN em API externa
    @Test
    @DisplayName("Retorna 200 com os dados do livro e sem gravar nada no banco")
    void returnsBookDataWithoutSaving_whenIsbnIsFound() throws Exception {
        BookMetadata metadata = new BookMetadata("Fantastic Mr. Fox", List.of("Roald Dahl"), "Puffin",
                1988, 96, List.of("Fiction"), "London", null, null, "https://covers.example/capa.jpg");
        when(googleBooksClient.findByIsbn(LOOKUP_ISBN)).thenReturn(Optional.of(metadata));
        long before = bookRepository.count();

        mockMvc.perform(get(LOOKUP_URL).param("isbn", "978-0-14-032872-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Fantastic Mr. Fox"))
                .andExpect(jsonPath("$.publicationYear").value(1988));

        assertEquals(before, bookRepository.count());
    }

    @Test
    @DisplayName("Retorna 400 quando o ISBN é inválido ou não é enviado")
    void returnsBadRequest_whenIsbnIsInvalidOrMissing() throws Exception {
        mockMvc.perform(get(LOOKUP_URL).param("isbn", "abc"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get(LOOKUP_URL))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(googleBooksClient, openLibraryClient);
    }

    @Test
    @DisplayName("Retorna 409 com o id do livro quando o ISBN já está cadastrado")
    void returnsConflictWithBookId_whenLookupIsbnIsAlreadyRegistered() throws Exception {
        Book saved = testData.saveBook(LOOKUP_ISBN, "Título exemplo", romance,
                testData.saveAuthor("Roald Dahl"));

        mockMvc.perform(get(LOOKUP_URL).param("isbn", LOOKUP_ISBN))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.bookId").value(saved.getId()));

        verifyNoInteractions(googleBooksClient, openLibraryClient);
    }

    @Test
    @DisplayName("Retorna 503 quando as duas APIs estão indisponíveis")
    void returnsServiceUnavailable_whenBothProvidersAreDown() throws Exception {
        when(googleBooksClient.findByIsbn(LOOKUP_ISBN))
                .thenThrow(new ExternalServiceException("Google Books indisponível"));
        when(openLibraryClient.findByIsbn(LOOKUP_ISBN))
                .thenThrow(new ExternalServiceException("Open Library indisponível"));

        mockMvc.perform(get(LOOKUP_URL).param("isbn", LOOKUP_ISBN))
                .andExpect(status().isServiceUnavailable());
    }

    // TESTES DE POST /books - Cadastro de livro com exemplares
    @Test
    @DisplayName("Retorna 201 com o detalhe do livro e grava livro, exemplar AVAILABLE e só o autor novo")
    void createsBookWithCopyAndNewAuthor_whenRequestIsValid() throws Exception {
        long booksBefore = bookRepository.count();
        long authorsBefore = authorRepository.count();

        postBook(registerBookJson(romance.getId(), NEW_ISBN, NEW_ACCESSION,
                "[\"Machado de Assis\", \"Clarice Lispector\"]"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", matchesPattern(".*/books/\\d+")))
                .andExpect(jsonPath("$.title").value("Livro de teste"))
                .andExpect(jsonPath("$.isbn").value(NEW_ISBN))
                .andExpect(jsonPath("$.category").value("Romance"))
                .andExpect(jsonPath("$.authors.length()").value(2))
                .andExpect(jsonPath("$.authors[0].name").value("Clarice Lispector"))
                .andExpect(jsonPath("$.authors[1].name").value("Machado de Assis"))
                .andExpect(jsonPath("$.totalCopies").value(1))
                .andExpect(jsonPath("$.copies[0].accessionNumber").value(NEW_ACCESSION))
                .andExpect(jsonPath("$.copies[0].status").value("AVAILABLE"));

        assertEquals(booksBefore + 1, bookRepository.count());
        assertEquals(authorsBefore + 1, authorRepository.count());   // Machado de Assis já existia
    }

    @Test
    @DisplayName("Reaproveita o autor existente quando o nome só difere em maiúsculas e espaços")
    void reusesExistingAuthor_whenNameDiffersOnlyInCaseAndSpaces() throws Exception {
        long authorsBefore = authorRepository.count();

        postBook(registerBookJson(romance.getId(), NEW_ISBN, NEW_ACCESSION, "[\" machado  de ASSIS \"]"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.authors.length()").value(1))
                .andExpect(jsonPath("$.authors[0].name").value("Machado de Assis"));

        assertEquals(authorsBefore, authorRepository.count());
    }

    @Test
    @DisplayName("Retorna 201 e o livro continua aparecendo nas consultas quando autores é omitido")
    void createsBookWithoutAuthors_whenAuthorsAreOmitted() throws Exception {
        String json = """
                {"title": "Livro sem autor", "categoryId": %d, "isbn": "%s",
                 "copies": [{"accessionNumber": "%s", "physicalLocation": "A-01"}]}
                """.formatted(romance.getId(), NEW_ISBN, NEW_ACCESSION);

        postBook(json)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.authors.length()").value(0));

        Integer id = bookRepository.findByIsbnAndDeletedAtIsNull(NEW_ISBN).orElseThrow().getId();
        mockMvc.perform(get("/books/{id}", id)).andExpect(status().isOk());
        mockMvc.perform(get("/books").param("q", "sem autor"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @Test
    @DisplayName("Retorna 400 com a lista de campos inválidos quando o corpo é vazio")
    void returnsBadRequestWithErrorList_whenBodyIsEmpty() throws Exception {
        postBook("{}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Dados inválidos"))
                .andExpect(jsonPath("$.errors[*].field", hasItems("title", "categoryId", "isbn", "copies")));
    }

    @Test
    @DisplayName("Retorna 400 apontando o campo isbn quando ele tem hífens")
    void returnsBadRequest_whenIsbnHasHyphens_inRegistration() throws Exception {
        postBook(registerBookJson(romance.getId(), "978-0-14-032872-1", NEW_ACCESSION, "[]"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("isbn")));
    }

    @Test
    @DisplayName("Retorna 400 apontando o caminho do campo quando o exemplar não tem tombo")
    void returnsBadRequestWithNestedPath_whenCopyHasNoAccessionNumber() throws Exception {
        String json = """
                {"title": "Livro", "categoryId": %d, "isbn": "%s",
                 "copies": [{"physicalLocation": "A-01"}]}
                """.formatted(romance.getId(), NEW_ISBN);

        postBook(json)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("copies[0].accessionNumber")));
    }

    @Test
    @DisplayName("Retorna 400 quando o JSON está mal formado")
    void returnsBadRequest_whenBodyIsMalformed() throws Exception {
        postBook("{")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Dados inválidos"));
    }

    @Test
    @DisplayName("Retorna 409 com o bookId quando o ISBN já está cadastrado")
    void returnsConflictWithBookId_whenIsbnIsAlreadyRegistered() throws Exception {
        postBook(registerBookJson(romance.getId(), DOM_CASMURRO_ISBN, NEW_ACCESSION, "[]"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.bookId").value(domCasmurro.getId()));
    }

    @Test
    @DisplayName("Retorna 409 com o tombo conflitante e não grava o livro quando o tombo já existe")
    void returnsConflictWithAccessionNumbers_whenAccessionNumberAlreadyExists() throws Exception {
        postBook(registerBookJson(romance.getId(), NEW_ISBN, DOM_CASMURRO_ACCESSION, "[]"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.accessionNumbers[0]").value(DOM_CASMURRO_ACCESSION));

        assertTrue(bookRepository.findByIsbnAndDeletedAtIsNull(NEW_ISBN).isEmpty());
    }

    @Test
    @DisplayName("Retorna 409 quando o mesmo tombo se repete dentro da requisição")
    void returnsConflict_whenAccessionNumberRepeatsInsideRequest() throws Exception {
        String json = """
                {"title": "Livro", "categoryId": %d, "isbn": "%s",
                 "copies": [{"accessionNumber": "REP-001", "physicalLocation": "A-01"},
                            {"accessionNumber": " REP-001 ", "physicalLocation": "A-02"}]}
                """.formatted(romance.getId(), NEW_ISBN);

        postBook(json)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.accessionNumbers[0]").value("REP-001"));

        assertTrue(bookRepository.findByIsbnAndDeletedAtIsNull(NEW_ISBN).isEmpty());
    }

    @Test
    @DisplayName("Retorna 422 e não grava livro nem autor quando a categoria não existe")
    void returnsUnprocessable_whenCategoryDoesNotExist() throws Exception {
        long authorsBefore = authorRepository.count();

        postBook(registerBookJson(NON_EXISTENT_ID, NEW_ISBN, NEW_ACCESSION, "[\"Autor Novo\"]"))
                .andExpect(status().is(422));

        assertTrue(bookRepository.findByIsbnAndDeletedAtIsNull(NEW_ISBN).isEmpty());
        assertEquals(authorsBefore, authorRepository.count());
    }

    // TESTES DE EXCLUSÃO LÓGICA - o que está excluído não aparece nas consultas do catálogo
    @Test
    @WithMockUser(roles = "READER")
    @DisplayName("Não retorna o livro excluído na listagem do leitor")
    void hidesDeletedBook_inReaderList() throws Exception {
        markBookDeleted(domCasmurro);

        mockMvc.perform(get("/books").param("q", "casmurro"))
                .andExpect(jsonPath("$.content.length()").value(0));
        mockMvc.perform(get("/books"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("Não retorna o livro excluído na listagem do bibliotecário")
    void hidesDeletedBook_inLibrarianList() throws Exception {
        markBookDeleted(domCasmurro);

        mockMvc.perform(get("/books/management").param("q", "casmurro"))
                .andExpect(jsonPath("$.content.length()").value(0));
    }

    @Test
    @WithMockUser(roles = "READER")
    @DisplayName("Retorna 404 no detalhe de um livro excluído")
    void returnsNotFound_whenBookIsDeleted() throws Exception {
        markBookDeleted(domCasmurro);

        mockMvc.perform(get("/books/{id}", domCasmurro.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Não conta livro nem exemplares excluídos no resumo do acervo")
    void ignoresDeletedBookAndCopies_inSummary() throws Exception {
        markBookDeleted(domCasmurro);   // Dom Casmurro: 1 exemplar disponível

        mockMvc.perform(get("/books/management/summary"))
                .andExpect(jsonPath("$.totalBooks").value(1))
                .andExpect(jsonPath("$.totalCopies").value(1))
                .andExpect(jsonPath("$.availableCopies").value(0))
                .andExpect(jsonPath("$.onLoanCopies").value(1));
    }

    @Test
    @DisplayName("Não conta nem lista o exemplar excluído de um livro que continua ativo")
    void ignoresDeletedCopy_whenBookRemainsActive() throws Exception {
        Copy extraCopy = testData.saveCopy(cleanCode, "003",  CopyStatus.AVAILABLE);
        markCopyDeleted(extraCopy);

        // detalhe: só o exemplar ativo (002, emprestado)
        mockMvc.perform(get("/books/{id}", cleanCode.getId()))
                .andExpect(jsonPath("$.totalCopies").value(1))
                .andExpect(jsonPath("$.copies.length()").value(1))
                .andExpect(jsonPath("$.copies[0].accessionNumber").value(CLEAN_CODE_ACCESSION));

        // listagem do bibliotecário: o exemplar disponível excluído não conta
        mockMvc.perform(get("/books/management").param("q", "clean code"))
                .andExpect(jsonPath("$.content[0].totalCopies").value(1))
                .andExpect(jsonPath("$.content[0].availableCopies").value(0));

        // listagem do leitor: continua indisponível
        mockMvc.perform(get("/books").param("q", "clean code"))
                .andExpect(jsonPath("$.content[0].available").value(false));
    }

    @Test
    @DisplayName("Consulta por ISBN de livro excluído segue para as APIs em vez de retornar 409")
    void lookupDoesNotConflict_whenBookWithSameIsbnIsDeleted() throws Exception {
        markBookDeleted(domCasmurro);
        BookMetadata metadata = new BookMetadata("Dom Casmurro", List.of("Machado de Assis"), null,
                null, null, List.of(), null, null, null, null);
        when(googleBooksClient.findByIsbn(DOM_CASMURRO_ISBN)).thenReturn(Optional.of(metadata));

        mockMvc.perform(get(LOOKUP_URL).param("isbn", DOM_CASMURRO_ISBN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Dom Casmurro"));
    }

    // TESTES DE DELETE /books - Exclusão lógica de livro e exemplar
    @Test
    @DisplayName("Retorna 204 e o livro com seus exemplares sai do catálogo quando não há empréstimos")
    void deletesBookWithCopies_whenBookHasNoLoans() throws Exception {
        Integer id = domCasmurro.getId();

        deleteRequest("/books/{id}", id).andExpect(status().isNoContent());

        mockMvc.perform(get("/books/{id}", id)).andExpect(status().isNotFound());
        mockMvc.perform(get("/books").param("q", "casmurro"))
                .andExpect(jsonPath("$.content.length()").value(0));
        mockMvc.perform(get("/books/management/summary"))
                .andExpect(jsonPath("$.totalBooks").value(1))
                .andExpect(jsonPath("$.totalCopies").value(1));
    }

    @Test
    @DisplayName("Grava o mesmo deleted_at no livro e nos exemplares excluídos juntos")
    void storesSameDeletedAt_whenBookIsDeleted() throws Exception {
        Integer id = domCasmurro.getId();

        deleteRequest("/books/{id}", id).andExpect(status().isNoContent());

        entityManager.flush();
        OffsetDateTime bookDeletedAt = jdbcTemplate.queryForObject(
                "select deleted_at from books where id = ?", OffsetDateTime.class, id);
        OffsetDateTime copyDeletedAt = jdbcTemplate.queryForObject(
                "select deleted_at from book_copies where book_id = ?", OffsetDateTime.class, id);
        assertNotNull(bookDeletedAt);
        assertEquals(bookDeletedAt, copyDeletedAt);
    }

    @Test
    @DisplayName("Retorna 409 com os tombos emprestados e mantém o livro quando há exemplar emprestado")
    void returnsConflictWithAccessionNumbers_whenBookHasCopyOnLoan() throws Exception {
        Integer id = cleanCode.getId();

        deleteRequest("/books/{id}", id)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Exclusão não permitida"))
                .andExpect(jsonPath("$.accessionNumbers[0]").value(CLEAN_CODE_ACCESSION));

        mockMvc.perform(get("/books/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCopies").value(1));
    }

    @Test
    @DisplayName("Retorna 404 ao excluir um livro que já foi excluído")
    void returnsNotFound_whenBookWasAlreadyDeleted() throws Exception {
        Integer id = domCasmurro.getId();

        deleteRequest("/books/{id}", id).andExpect(status().isNoContent());
        deleteRequest("/books/{id}", id).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Retorna 404 em formato ProblemDetail ao excluir livro inexistente")
    void returnsNotFound_whenDeletingNonExistentBook() throws Exception {
        deleteRequest("/books/{id}", NON_EXISTENT_ID)
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Recurso não encontrado"));
    }

    @Test
    @DisplayName("Retorna 400 quando o id do livro a excluir não é numérico")
    void returnsBadRequest_whenDeletingWithNonNumericId() throws Exception {
        deleteRequest("/books/abc").andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Retorna 204 e o livro continua com os outros exemplares quando exclui um de dois")
    void deletesOnlyTheCopy_whenBookHasOtherActiveCopies() throws Exception {
        testData.saveCopy(domCasmurro, "003", CopyStatus.AVAILABLE);

        deleteRequest("/books/{bookId}/copies/{copyId}", domCasmurro.getId(), domCasmurroCopy.getId())
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/books/{id}", domCasmurro.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCopies").value(1))
                .andExpect(jsonPath("$.copies[0].accessionNumber").value("003"));
    }

    @Test
    @DisplayName("Exclui também o livro quando o exemplar excluído é o último")
    void deletesBookToo_whenLastCopyIsDeleted() throws Exception {
        Integer id = domCasmurro.getId();

        deleteRequest("/books/{bookId}/copies/{copyId}", id, domCasmurroCopy.getId())
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/books/{id}", id)).andExpect(status().isNotFound());
        mockMvc.perform(get("/books").param("q", "casmurro"))
                .andExpect(jsonPath("$.content.length()").value(0));
        mockMvc.perform(get("/books/management/summary"))
                .andExpect(jsonPath("$.totalBooks").value(1))
                .andExpect(jsonPath("$.totalCopies").value(1));
    }

    @Test
    @DisplayName("Retorna 409 com o tombo e mantém o exemplar quando ele está emprestado")
    void returnsConflict_whenDeletingCopyOnLoan() throws Exception {
        Integer id = cleanCode.getId();

        deleteRequest("/books/{bookId}/copies/{copyId}", id, cleanCodeCopy.getId())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.accessionNumbers[0]").value(CLEAN_CODE_ACCESSION));

        mockMvc.perform(get("/books/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.copies.length()").value(1));
    }

    @Test
    @DisplayName("Retorna 404 quando o exemplar pertence a outro livro")
    void returnsNotFound_whenCopyBelongsToAnotherBook() throws Exception {
        // O exemplar 001 é do Dom Casmurro, não do Clean Code
        deleteRequest("/books/{bookId}/copies/{copyId}", cleanCode.getId(), domCasmurroCopy.getId())
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/books/{id}", domCasmurro.getId()))
                .andExpect(jsonPath("$.totalCopies").value(1));
    }

    @Test
    @DisplayName("Retorna 404 ao excluir um exemplar que já foi excluído")
    void returnsNotFound_whenCopyWasAlreadyDeleted() throws Exception {
        testData.saveCopy(domCasmurro, "003", CopyStatus.AVAILABLE);
        Integer copyId = domCasmurroCopy.getId();

        deleteRequest("/books/{bookId}/copies/{copyId}", domCasmurro.getId(), copyId)
                .andExpect(status().isNoContent());
        deleteRequest("/books/{bookId}/copies/{copyId}", domCasmurro.getId(), copyId)
                .andExpect(status().isNotFound());
    }

    // MÉTODOS AUXILIARES

    private ResultActions postBook(String json) throws Exception {
        return mockMvc.perform(postJson("/books", json));
    }

    private ResultActions deleteRequest(String url, Object... uriVars) throws Exception {
        return mockMvc.perform(delete(url, uriVars));
    }

    private String registerBookJson(int categoryId, String isbn, String accessionNumber, String authorsJson) {
        return """
                {
                  "title": "Livro de teste",
                  "authors": %s,
                  "categoryId": %d,
                  "isbn": "%s",
                  "publisher": "Puffin",
                  "publicationYear": 1988,
                  "pageCount": 96,
                  "copies": [{"accessionNumber": "%s", "physicalLocation": "A-01"}]
                }
                """.formatted(authorsJson, categoryId, isbn, accessionNumber);
    }

    // Livro com todos os campos opcionais preenchidos (o TestData cria só o mínimo)
    private Book saveBookWithAllFields(Category category, Author... authors) {
        Book b = new Book();
        b.setIsbn("9788500000019");
        b.setTitle("Estruturas de Dados em Java");
        b.setPublisher("Editora Horizonte");
        b.setPublicationPlace("São Paulo");
        b.setEdition("2ª edição");
        b.setCoverImageUrl("https://example.com/covers/estruturas.jpg");
        b.setPublicationYear(2021);
        b.setPageCount(480);
        b.setSummary("Introdução a listas, pilhas, filas, árvores e grafos, com exemplos em Java.");
        b.setCategory(category);
        b.getAuthors().addAll(List.of(authors));
        return bookRepository.save(b);
    }

    // Exclusão lógica feita direto no banco, para testar só as consultas
    private void markBookDeleted(Book book) {
        jdbcTemplate.update("update book_copies set deleted_at = now() where book_id = ?", book.getId());
        jdbcTemplate.update("update books set deleted_at = now() where id = ?", book.getId());
    }

    private void markCopyDeleted(Copy copy) {
        jdbcTemplate.update("update book_copies set deleted_at = now() where id = ?", copy.getId());
    }
}
