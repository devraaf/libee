package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.entity.Author;
import br.edu.fatec.libee.backend.entity.Book;
import br.edu.fatec.libee.backend.entity.Category;
import br.edu.fatec.libee.backend.entity.Copy;
import br.edu.fatec.libee.backend.enums.CopyStatus;
import br.edu.fatec.libee.backend.repository.AuthorRepository;
import br.edu.fatec.libee.backend.repository.BookRepository;
import br.edu.fatec.libee.backend.repository.CategoryRepository;
import br.edu.fatec.libee.backend.repository.CopyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@WithMockUser
@AutoConfigureMockMvc
@Transactional
@Testcontainers
public class BookControllerIT {
    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16");

    @Autowired MockMvc mockMvc;
    @Autowired BookRepository bookRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired AuthorRepository authorRepository;
    @Autowired CopyRepository copyRepository;
    @Autowired JdbcTemplate jdbcTemplate;

    private Category romance;
    private Category tecnologia;
    private static final int NON_EXISTENT_ID = 999_999;
    @BeforeEach
    void setUp(){
        // Esvazia o catálogo para o teste não depender de dados pré-existentes
        jdbcTemplate.execute(
                "TRUNCATE TABLE loans, book_copies, book_author, books, authors, categories " +
                        "RESTART IDENTITY CASCADE");

        romance = saveCategory("Romance");
        tecnologia = saveCategory("Tecnologia");

        Author machado = saveAuthor("Machado de Assis");
        Author martin = saveAuthor("Robert C. Martin");

        Book domCasmurro = saveBook("9788535911664", "Dom Casmurro", romance, machado);
        Book cleanCode = saveBook("9780132350884", "Clean Code", tecnologia, martin);

        saveCopy(domCasmurro, "001", "A-01", CopyStatus.AVAILABLE);
        saveCopy(cleanCode, "002", "A-01", CopyStatus.ON_LOAN);
    }

    @Test
    @DisplayName("Retorna livros paginados quando page e size são informados")
    void returnsPagedBooks_whenPageAndSizeAreProvided() throws Exception{
        mockMvc.perform(get("/books").param("page", "0").param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2));
    }

    @Test
    @DisplayName("Retorna o livro correspondente ao buscar por título")
    void returnsMatchingBook_whenSearchingByTitle() throws Exception {
        mockMvc.perform(get("/books").param("q", "casmurro"))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Dom Casmurro"));
    }

    @Test
    @DisplayName("Retorna o livro correspondente ao buscar pelo nome do autor")
    void returnsMatchingBook_whenSearchingByAuthorName() throws Exception {
        mockMvc.perform(get("/books").param("q", "martin"))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Clean Code"));
    }

    @Test
    @DisplayName("Retorna o livro correspondente quando o ISBN é digitado com hífens")
    void returnsMatchingBook_whenIsbnHasHyphens() throws Exception {
        mockMvc.perform(get("/books").param("q", "978-0-13-235088-4"))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Clean Code"));
    }

    @Test
    @DisplayName("Retorna apenas livros da categoria quando categoryId é informado")
    void returnsOnlyBooksOfCategory_whenCategoryIdIsProvided() throws Exception {
        mockMvc.perform(get("/books").param("categoryId", tecnologia.getId().toString()))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].category").value("Tecnologia"));
    }

    @Test
    @DisplayName("Retorna lista vazia quando a busca não tem resultado")
    void returnsEmptyList_whenSearchHasNoMatch() throws Exception {
        mockMvc.perform(get("/books").param("q", "zzzzzz"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @DisplayName("Marca o livro como disponível quando há exemplar disponível")
    void marksBookAsAvailable_whenItHasAvailableCopy() throws Exception {
        mockMvc.perform(get("/books").param("q", "casmurro"))
                .andExpect(jsonPath("$.content[0].available").value(true));
        mockMvc.perform(get("/books").param("q", "clean code"))
                .andExpect(jsonPath("$.content[0].available").value(false));
    }

    @Test
    @DisplayName("Retorna 400 quando size é zero")
    void returnsBadRequest_whenSizeIsZero() throws Exception {
        mockMvc.perform(get("/books").param("size", "0"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Retorna 400 quando size excede o limite de 100")
    void returnsBadRequest_whenSizeExceedsLimit() throws Exception {
        mockMvc.perform(get("/books").param("size", "101"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Retorna 400 quando page é negativo")
    void returnsBadRequest_whenPageIsNegative() throws Exception {
        mockMvc.perform(get("/books").param("page", "-1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Retorna 400 quando categoryId não é numérico")
    void returnsBadRequest_whenCategoryIdIsNotNumeric() throws Exception {
        mockMvc.perform(get("/books").param("categoryId", "abc"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithAnonymousUser
    @DisplayName("Retorna 401 quando o usuário não está autenticado")
    void returnsUnauthorized_whenUserIsNotAuthenticated() throws Exception {
        mockMvc.perform(get("/books"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Retorna todos os campos do livro, com autores e exemplares ordenados")
    void returnsCompleteDetails_whenBookHasAllFields() throws Exception {
        Author zelia = saveAuthor("Zélia Furtado");
        Author ana = saveAuthor("Ana Beatriz Lima");
        Book book = saveCompleteBook(tecnologia, zelia, ana);
        saveCopy(book, "0003", "A-03", CopyStatus.ON_LOAN);
        saveCopy(book, "0001", "A-01", CopyStatus.AVAILABLE);
        saveCopy(book, "0002", "A-02", CopyStatus.AVAILABLE);

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
    @DisplayName("Retorna lista de exemplares vazia e total 0 quando o livro não tem exemplares")
    void returnsEmptyCopies_whenBookHasNoCopies() throws Exception {
        Book book = saveBook("9780306406157", "Livro Sem Exemplares", romance, saveAuthor("Autora Teste"));

        mockMvc.perform(get("/books/{id}", book.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.copies.length()").value(0))
                .andExpect(jsonPath("$.totalCopies").value(0));
    }

    @Test
    @DisplayName("Retorna 200 com campos opcionais nulos quando o livro só tem os dados obrigatórios")
    void returnsNullOptionalFields_whenBookHasOnlyRequiredData() throws Exception {
        Book book = saveBook("9780306406157", "Livro Mínimo", romance, saveAuthor("Autora Teste"));

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
    @DisplayName("Retorna 400 quando o id não é numérico")
    void returnsBadRequest_whenIdIsNotNumeric() throws Exception {
        mockMvc.perform(get("/books/abc"))
                .andExpect(status().isBadRequest());
    }

    // métodos auxiliares para montar os dados
    private Category saveCategory(String name) {
        Category c = new Category();
        c.setName(name);
        return categoryRepository.save(c);
    }

    private Author saveAuthor(String name) {
        Author a = new Author();
        a.setName(name);
        return authorRepository.save(a);
    }

    private Book saveBook(String isbn, String title, Category category, Author author) {
        Book b = new Book();
        b.setIsbn(isbn);
        b.setTitle(title);
        b.setCategory(category);
        b.getAuthors().add(author);
        return bookRepository.save(b);
    }

    private Book saveCompleteBook(Category category, Author... authors) {
        Book b = new Book();
        b.setIsbn("9788500000019");
        b.setTitle("Estruturas de Dados em Java");
        b.setPublisher("Editora Horizonte");
        b.setPublicationPlace("São Paulo");
        b.setEdition("2ª edição");
        b.setCoverImageUrl("https://example.com/covers/estruturas.jpg");
        b.setPublicationDate(LocalDate.of(2021, 3, 15));
        b.setPageCount(480);
        b.setSummary("Introdução a listas, pilhas, filas, árvores e grafos, com exemplos em Java.");
        b.setCategory(category);
        b.getAuthors().addAll(List.of(authors));
        return bookRepository.save(b);
    }

    private void saveCopy(Book book, String accession, String location, CopyStatus status) {
        Copy c = new Copy();
        c.setBook(book);
        c.setAccessionNumber(accession);
        c.setPhysicalLocation(location);
        c.setStatus(status);
        copyRepository.save(c);
    }
}
