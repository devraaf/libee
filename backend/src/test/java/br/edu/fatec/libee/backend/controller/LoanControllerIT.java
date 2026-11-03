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
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@WithMockUser
@AutoConfigureMockMvc
@Transactional
@Testcontainers
public class LoanControllerIT {
    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16");

    // "Hoje" fixo nos testes, para os status não dependerem da data real
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 15);

    @TestConfiguration
    static class FixedClockConfig {
        @Bean
        @Primary
        Clock fixedClock() {
            ZoneId zone = ZoneId.of("America/Sao_Paulo");
            return Clock.fixed(TODAY.atTime(12, 0).atZone(zone).toInstant(), zone);
        }
    }

    @Autowired MockMvc mockMvc;
    @Autowired CategoryRepository categoryRepository;
    @Autowired AuthorRepository authorRepository;
    @Autowired BookRepository bookRepository;
    @Autowired CopyRepository copyRepository;
    @Autowired JdbcTemplate jdbcTemplate;

    private Category tecnologia;
    private Author martin;
    private Author evans;
    private Book cleanCode;
    private Book domainDrivenDesign;
    private int reader;
    private int otherReader;
    private int librarian;
    private int accessionSeq = 0;

    @BeforeEach
    void setUp() {
        // Esvazia acervo e empréstimos para o teste não depender de dados pré-existentes
        jdbcTemplate.execute(
                "TRUNCATE TABLE loans, book_copies, book_author, books, authors, categories " +
                        "RESTART IDENTITY CASCADE");

        tecnologia = saveCategory("Tecnologia");
        martin = saveAuthor("Robert C. Martin");
        evans = saveAuthor("Eric Evans");
        cleanCode = saveBook("9780132350884", "Clean Code", tecnologia, martin);
        domainDrivenDesign = saveBook("9780321125217", "Domain-Driven Design", tecnologia, evans);

        reader = saveUser("Leitora Um", "loan-it-leitora1@fatec.sp.gov.br", "READER");
        otherReader = saveUser("Leitor Dois", "loan-it-leitor2@fatec.sp.gov.br", "READER");
        librarian = saveUser("Bibliotecário", "loan-it-biblio@fatec.sp.gov.br", "LIBRARIAN");
    }

    // TESTES DE GET /loans - Lista de empréstimos do leitor
    @Test
    @DisplayName("Retorna todos os campos do empréstimo, com livro, tombo e datas")
    void returnsCompleteLoan_whenReaderHasLoan() throws Exception {
        Copy copy = saveCopy(cleanCode, "T-001");
        saveLoan(copy, reader, TODAY.minusDays(3), TODAY.plusDays(4), null, 1);

        mockMvc.perform(get("/loans").param("readerId", String.valueOf(reader)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].id").exists())
                .andExpect(jsonPath("$.content[0].book.id").value(cleanCode.getId()))
                .andExpect(jsonPath("$.content[0].book.title").value("Clean Code"))
                .andExpect(jsonPath("$.content[0].book.authors[0]").value("Robert C. Martin"))
                .andExpect(jsonPath("$.content[0].book.coverImageUrl").value(nullValue()))
                .andExpect(jsonPath("$.content[0].accessionNumber").value("T-001"))
                .andExpect(jsonPath("$.content[0].loanDate").value("2026-10-12"))
                .andExpect(jsonPath("$.content[0].dueDate").value("2026-10-19"))
                .andExpect(jsonPath("$.content[0].returnDate").value(nullValue()))
                .andExpect(jsonPath("$.content[0].renewalCount").value(1))
                .andExpect(jsonPath("$.content[0].status").value("ON_TIME"));
    }

    @Test
    @DisplayName("Retorna do empréstimo mais recente para o mais antigo")
    void returnsLoansFromMostRecentToOldest() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(30), TODAY.minusDays(23), TODAY.minusDays(25), 0);
        saveLoan(saveCopy(cleanCode, "T-002"), reader, TODAY.minusDays(2), TODAY.plusDays(5), null, 0);
        saveLoan(saveCopy(cleanCode, "T-003"), reader, TODAY.minusDays(10), TODAY.minusDays(3), null, 0);

        mockMvc.perform(get("/loans").param("readerId", String.valueOf(reader)))
                .andExpect(jsonPath("$.content[0].loanDate").value("2026-10-13"))
                .andExpect(jsonPath("$.content[1].loanDate").value("2026-10-05"))
                .andExpect(jsonPath("$.content[2].loanDate").value("2026-09-15"));
    }

    @Test
    @DisplayName("Retorna empréstimos paginados quando page e size são informados")
    void returnsPagedLoans_whenPageAndSizeAreProvided() throws Exception {
        for (int i = 1; i <= 3; i++) {
            saveLoan(saveCopy(cleanCode, "T-00" + i), reader, TODAY.minusDays(i), TODAY.plusDays(7), null, 0);
        }

        mockMvc.perform(get("/loans").param("readerId", String.valueOf(reader))
                        .param("page", "0").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2));

        mockMvc.perform(get("/loans").param("readerId", String.valueOf(reader))
                        .param("page", "1").param("size", "2"))
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    // FILTRO POR STATUS
    @Test
    @DisplayName("Retorna só os empréstimos em dia quando status é ON_TIME, incluindo o que vence hoje")
    void returnsOnlyOnTimeLoans_whenStatusIsOnTime() throws Exception {
        saveStatusScenario();

        mockMvc.perform(get("/loans").param("readerId", String.valueOf(reader)).param("status", "ON_TIME"))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[*].status").value(org.hamcrest.Matchers.everyItem(
                        org.hamcrest.Matchers.is("ON_TIME"))));
    }

    @Test
    @DisplayName("Retorna só os empréstimos atrasados quando status é OVERDUE")
    void returnsOnlyOverdueLoans_whenStatusIsOverdue() throws Exception {
        saveStatusScenario();

        mockMvc.perform(get("/loans").param("readerId", String.valueOf(reader)).param("status", "OVERDUE"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].status").value("OVERDUE"))
                .andExpect(jsonPath("$.content[0].dueDate").value("2026-10-12"));
    }

    @Test
    @DisplayName("Retorna só os empréstimos devolvidos quando status é RETURNED")
    void returnsOnlyReturnedLoans_whenStatusIsReturned() throws Exception {
        saveStatusScenario();

        mockMvc.perform(get("/loans").param("readerId", String.valueOf(reader)).param("status", "RETURNED"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].status").value("RETURNED"))
                .andExpect(jsonPath("$.content[0].returnDate").value("2026-10-01"));
    }

    @Test
    @DisplayName("Retorna os empréstimos ativos quando status é enviado mais de uma vez")
    void returnsActiveLoans_whenMultipleStatusesAreProvided() throws Exception {
        saveStatusScenario();

        mockMvc.perform(get("/loans").param("readerId", String.valueOf(reader))
                        .param("status", "ON_TIME", "OVERDUE"))
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    @Test
    @DisplayName("Retorna 400 quando status não é um valor válido")
    void returnsBadRequest_whenStatusIsInvalid() throws Exception {
        mockMvc.perform(get("/loans").param("readerId", String.valueOf(reader)).param("status", "INVALIDO"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.timestamp").exists());
    }

    // BUSCA
    @Test
    @DisplayName("Retorna o empréstimo correspondente ao buscar por título")
    void returnsMatchingLoan_whenSearchingByTitle() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(1), TODAY.plusDays(6), null, 0);
        saveLoan(saveCopy(domainDrivenDesign, "T-002"), reader, TODAY.minusDays(2), TODAY.plusDays(5), null, 0);

        mockMvc.perform(get("/loans").param("readerId", String.valueOf(reader)).param("search", "CLEAN"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].book.title").value("Clean Code"));
    }

    @Test
    @DisplayName("Retorna o empréstimo correspondente ao buscar pelo nome do autor")
    void returnsMatchingLoan_whenSearchingByAuthorName() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(1), TODAY.plusDays(6), null, 0);
        saveLoan(saveCopy(domainDrivenDesign, "T-002"), reader, TODAY.minusDays(2), TODAY.plusDays(5), null, 0);

        mockMvc.perform(get("/loans").param("readerId", String.valueOf(reader)).param("search", "evans"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].book.title").value("Domain-Driven Design"));
    }

    @Test
    @DisplayName("Retorna lista vazia quando a busca casa mas o status não")
    void returnsEmptyList_whenSearchMatchesButStatusDoesNot() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(1), TODAY.plusDays(6), null, 0);

        mockMvc.perform(get("/loans").param("readerId", String.valueOf(reader))
                        .param("search", "clean").param("status", "OVERDUE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    // LISTA VAZIA E ISOLAMENTO
    @Test
    @DisplayName("Retorna 200 com lista vazia quando o leitor não tem empréstimos")
    void returnsEmptyList_whenReaderHasNoLoans() throws Exception {
        mockMvc.perform(get("/loans").param("readerId", String.valueOf(reader)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @DisplayName("Não retorna empréstimos de outro leitor")
    void doesNotReturnLoansOfAnotherReader() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(1), TODAY.plusDays(6), null, 0);
        saveLoan(saveCopy(domainDrivenDesign, "T-002"), otherReader, TODAY.minusDays(1), TODAY.plusDays(6), null, 0);

        mockMvc.perform(get("/loans").param("readerId", String.valueOf(reader)))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].book.title").value("Clean Code"));

        mockMvc.perform(get("/loans").param("readerId", String.valueOf(otherReader)))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].book.title").value("Domain-Driven Design"));
    }

    // VALIDAÇÃO E SEGURANÇA
    @Test
    @DisplayName("Retorna 400 quando size é zero")
    void returnsBadRequest_whenSizeIsZero() throws Exception {
        mockMvc.perform(get("/loans").param("readerId", String.valueOf(reader)).param("size", "0"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Retorna 400 quando size excede o limite de 100")
    void returnsBadRequest_whenSizeExceedsLimit() throws Exception {
        mockMvc.perform(get("/loans").param("readerId", String.valueOf(reader)).param("size", "101"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Retorna 400 quando page é negativo")
    void returnsBadRequest_whenPageIsNegative() throws Exception {
        mockMvc.perform(get("/loans").param("readerId", String.valueOf(reader)).param("page", "-1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithAnonymousUser
    @DisplayName("Retorna 401 quando o usuário não está autenticado")
    void returnsUnauthorized_whenUserIsNotAuthenticated() throws Exception {
        mockMvc.perform(get("/loans").param("readerId", String.valueOf(reader)))
                .andExpect(status().isUnauthorized());
    }

    // TESTES DE GET /loans/upcoming-returns - Próximas devoluções do leitor
    @Test
    @DisplayName("Retorna id, título, autores, ano, capa e data prevista de cada item, sem status")
    void returnsUpcomingReturnFields_whenReaderHasActiveLoan() throws Exception {
        cleanCode.setCoverImageUrl("https://example.com/covers/clean-code.jpg");
        cleanCode.setPublicationYear(2008);
        bookRepository.save(cleanCode);
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(2), TODAY.plusDays(5), null, 0);

        mockMvc.perform(get("/loans/upcoming-returns").param("readerId", String.valueOf(reader)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").exists())
                .andExpect(jsonPath("$[0].title").value("Clean Code"))
                .andExpect(jsonPath("$[0].authors[0]").value("Robert C. Martin"))
                .andExpect(jsonPath("$[0].publicationYear").value(2008))
                .andExpect(jsonPath("$[0].coverImageUrl").value("https://example.com/covers/clean-code.jpg"))
                .andExpect(jsonPath("$[0].dueDate").value("2026-10-20"))
                .andExpect(jsonPath("$[0].status").doesNotExist());
    }

    @Test
    @DisplayName("Mostra o empréstimo atrasado primeiro, por ter a data prevista mais antiga")
    void returnsOverdueLoanFirst() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(2), TODAY.plusDays(2), null, 0);
        saveLoan(saveCopy(cleanCode, "T-002"), reader, TODAY.minusDays(10), TODAY.minusDays(3), null, 0);  // atrasado
        saveLoan(saveCopy(cleanCode, "T-003"), reader, TODAY.minusDays(2), TODAY.plusDays(5), null, 0);

        mockMvc.perform(get("/loans/upcoming-returns").param("readerId", String.valueOf(reader)))
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].dueDate").value("2026-10-12"))   // vencida antes de hoje (15/10)
                .andExpect(jsonPath("$[1].dueDate").value("2026-10-17"))
                .andExpect(jsonPath("$[2].dueDate").value("2026-10-20"));
    }

    @Test
    @DisplayName("Retorna os autores do livro em ordem alfabética")
    void returnsAuthorsInAlphabeticalOrder() throws Exception {
        cleanCode.getAuthors().add(evans);   // martin já é autor; evans entra depois
        bookRepository.save(cleanCode);
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(2), TODAY.plusDays(5), null, 0);

        mockMvc.perform(get("/loans/upcoming-returns").param("readerId", String.valueOf(reader)))
                .andExpect(jsonPath("$[0].authors.length()").value(2))
                .andExpect(jsonPath("$[0].authors[0]").value("Eric Evans"))
                .andExpect(jsonPath("$[0].authors[1]").value("Robert C. Martin"));
    }

    @Test
    @DisplayName("Ordena pela data prevista, do mais próximo para o mais distante")
    void ordersUpcomingReturnsByDueDate() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(2), TODAY.plusDays(5), null, 0);
        saveLoan(saveCopy(cleanCode, "T-002"), reader, TODAY.minusDays(2), TODAY.plusDays(1), null, 0);
        saveLoan(saveCopy(cleanCode, "T-003"), reader, TODAY.minusDays(2), TODAY.plusDays(3), null, 0);

        mockMvc.perform(get("/loans/upcoming-returns").param("readerId", String.valueOf(reader)))
                .andExpect(jsonPath("$[0].dueDate").value("2026-10-16"))
                .andExpect(jsonPath("$[1].dueDate").value("2026-10-18"))
                .andExpect(jsonPath("$[2].dueDate").value("2026-10-20"));
    }

    @Test
    @DisplayName("Retorna 3 itens por padrão quando limit não é informado")
    void returnsThreeItemsByDefault_whenLimitIsNotProvided() throws Exception {
        for (int i = 1; i <= 4; i++) {
            saveLoan(saveCopy(cleanCode, "T-00" + i), reader, TODAY.minusDays(2), TODAY.plusDays(i), null, 0);
        }

        mockMvc.perform(get("/loans/upcoming-returns").param("readerId", String.valueOf(reader)))
                .andExpect(jsonPath("$.length()").value(3));
    }

    @Test
    @DisplayName("Respeita o limit informado e mantém os mais próximos")
    void respectsLimit_whenLimitIsProvided() throws Exception {
        for (int i = 1; i <= 4; i++) {
            saveLoan(saveCopy(cleanCode, "T-00" + i), reader, TODAY.minusDays(2), TODAY.plusDays(i), null, 0);
        }

        mockMvc.perform(get("/loans/upcoming-returns")
                        .param("readerId", String.valueOf(reader)).param("limit", "2"))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].dueDate").value("2026-10-16"))
                .andExpect(jsonPath("$[1].dueDate").value("2026-10-17"));
    }

    @Test
    @DisplayName("Não retorna empréstimo já devolvido")
    void doesNotReturnReturnedLoan() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(20), TODAY.minusDays(13),
                TODAY.minusDays(14), 0);                                                            // devolvido
        saveLoan(saveCopy(cleanCode, "T-002"), reader, TODAY.minusDays(2), TODAY.plusDays(5), null, 0);

        mockMvc.perform(get("/loans/upcoming-returns").param("readerId", String.valueOf(reader)))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].dueDate").value("2026-10-20"));
    }

    @Test
    @DisplayName("Retorna 200 com lista vazia quando o leitor não tem empréstimos ativos")
    void returnsEmptyList_whenReaderHasNoActiveLoans() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(20), TODAY.minusDays(13),
                TODAY.minusDays(14), 0);                                                            // só devolvido

        mockMvc.perform(get("/loans/upcoming-returns").param("readerId", String.valueOf(reader)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("Não retorna empréstimos de outro leitor")
    void doesNotReturnUpcomingReturnsOfAnotherReader() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(2), TODAY.plusDays(5), null, 0);
        saveLoan(saveCopy(domainDrivenDesign, "T-002"), otherReader, TODAY.minusDays(2), TODAY.plusDays(1), null, 0);

        mockMvc.perform(get("/loans/upcoming-returns").param("readerId", String.valueOf(reader)))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Clean Code"));
    }

    @Test
    @DisplayName("Retorna 400 quando limit é zero ou excede o máximo")
    void returnsBadRequest_whenLimitIsOutOfRange() throws Exception {
        mockMvc.perform(get("/loans/upcoming-returns")
                        .param("readerId", String.valueOf(reader)).param("limit", "0"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/loans/upcoming-returns")
                        .param("readerId", String.valueOf(reader)).param("limit", "21"))
                .andExpect(status().isBadRequest());
    }

    // TESTES DE GET /loans/management/summary - Contadores dos cards (bibliotecário)
    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna os contadores de ativos, em dia e atrasados, sem contar os devolvidos")
    void returnsLoanCounters_whenThereAreLoansInEachStatus() throws Exception {
        saveStatusScenario();   // 2 em dia (um vence hoje), 1 atrasado, 1 devolvido
        saveLoan(saveCopy(domainDrivenDesign, "T-005"), otherReader,
                TODAY.minusDays(9), TODAY.minusDays(2), null, 0);   // atrasado de outro leitor

        mockMvc.perform(get("/loans/management/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeLoans").value(4))
                .andExpect(jsonPath("$.onTimeLoans").value(2))
                .andExpect(jsonPath("$.overdueLoans").value(2));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Não conta empréstimos devolvidos em nenhum contador")
    void doesNotCountReturnedLoans() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(20), TODAY.minusDays(13),
                TODAY.minusDays(14), 0);   // devolvido no prazo
        saveLoan(saveCopy(cleanCode, "T-002"), reader, TODAY.minusDays(30), TODAY.minusDays(23),
                TODAY.minusDays(5), 0);    // devolvido com atraso

        mockMvc.perform(get("/loans/management/summary"))
                .andExpect(jsonPath("$.activeLoans").value(0))
                .andExpect(jsonPath("$.onTimeLoans").value(0))
                .andExpect(jsonPath("$.overdueLoans").value(0));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna todos os contadores zerados quando não há empréstimos")
    void returnsZeros_whenThereAreNoLoans() throws Exception {
        mockMvc.perform(get("/loans/management/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeLoans").value(0))
                .andExpect(jsonPath("$.onTimeLoans").value(0))
                .andExpect(jsonPath("$.overdueLoans").value(0));
    }

    @Test
    @WithAnonymousUser
    @DisplayName("Retorna 401 quando o usuário não está autenticado")
    void returnsUnauthorized_whenUserIsNotAuthenticatedOnSummary() throws Exception {
        mockMvc.perform(get("/loans/management/summary"))
                .andExpect(status().isUnauthorized());
    }

    // TESTES DE GET /loans/management - Lista e pesquisa de empréstimos ativos (bibliotecário)
    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna os empréstimos ativos com todos os campos, ordenados pela data prevista")
    void returnsActiveLoansOrderedByDueDate() throws Exception {
        saveStatusScenario();

        mockMvc.perform(get("/loans/management"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(3))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.content[0].id").exists())
                .andExpect(jsonPath("$.content[0].readerName").value("Leitora Um"))
                .andExpect(jsonPath("$.content[0].title").value("Clean Code"))
                .andExpect(jsonPath("$.content[0].accessionNumber").value("T-003"))
                .andExpect(jsonPath("$.content[0].loanDate").value("2026-10-05"))
                .andExpect(jsonPath("$.content[0].dueDate").value("2026-10-12"))
                .andExpect(jsonPath("$.content[0].renewalCount").value(0))
                .andExpect(jsonPath("$.content[0].status").value("OVERDUE"))
                .andExpect(jsonPath("$.content[1].dueDate").value("2026-10-15"))
                .andExpect(jsonPath("$.content[2].dueDate").value("2026-10-20"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Inclui empréstimos de todos os leitores e não inclui os devolvidos")
    void includesLoansOfAllReaders_andExcludesReturnedOnes() throws Exception {
        saveStatusScenario();
        saveLoan(saveCopy(domainDrivenDesign, "T-005"), otherReader, TODAY.minusDays(1), TODAY.plusDays(6), null, 0);
        saveLoan(saveCopy(domainDrivenDesign, "T-006"), otherReader, TODAY.minusDays(20), TODAY.minusDays(13),
                TODAY.minusDays(14), 0);   // devolvido de outro leitor

        mockMvc.perform(get("/loans/management"))
                .andExpect(jsonPath("$.totalElements").value(4))
                .andExpect(jsonPath("$.content[*].status",
                        org.hamcrest.Matchers.not(org.hamcrest.Matchers.hasItem("RETURNED"))));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna empréstimos paginados quando page e size são informados")
    void returnsPagedActiveLoans_whenPageAndSizeAreProvided() throws Exception {
        saveStatusScenario();

        mockMvc.perform(get("/loans/management").param("page", "0").param("size", "2"))
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2));

        mockMvc.perform(get("/loans/management").param("page", "1").param("size", "2"))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].dueDate").value("2026-10-20"));
    }

    // FILTRO POR STATUS
    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Filtra por status: em dia, atrasado ou os dois")
    void filtersActiveLoansByStatus() throws Exception {
        saveStatusScenario();

        mockMvc.perform(get("/loans/management").param("status", "ON_TIME"))
                .andExpect(jsonPath("$.totalElements").value(2));

        mockMvc.perform(get("/loans/management").param("status", "OVERDUE"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].accessionNumber").value("T-003"));

        mockMvc.perform(get("/loans/management").param("status", "ON_TIME", "OVERDUE"))
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna 400 quando status é inválido ou é RETURNED")
    void returnsBadRequest_whenStatusIsInvalidOrReturned() throws Exception {
        mockMvc.perform(get("/loans/management").param("status", "INVALIDO"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.timestamp").exists());

        mockMvc.perform(get("/loans/management").param("status", "RETURNED"))
                .andExpect(status().isBadRequest());
    }

    // PESQUISA
    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Pesquisa pelo nome do leitor, sem diferenciar maiúsculas de minúsculas")
    void searchesByReaderName() throws Exception {
        saveStatusScenario();
        saveLoan(saveCopy(domainDrivenDesign, "T-005"), otherReader, TODAY.minusDays(1), TODAY.plusDays(6), null, 0);

        mockMvc.perform(get("/loans/management").param("search", "LEITOR DOIS"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].readerName").value("Leitor Dois"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Pesquisa pelo tombo, sem diferenciar maiúsculas de minúsculas")
    void searchesByAccessionNumber() throws Exception {
        saveStatusScenario();

        mockMvc.perform(get("/loans/management").param("search", "t-003"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].accessionNumber").value("T-003"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Pesquisa pelo título do livro, sem diferenciar maiúsculas de minúsculas")
    void searchesByBookTitle() throws Exception {
        saveStatusScenario();
        saveLoan(saveCopy(domainDrivenDesign, "T-005"), otherReader, TODAY.minusDays(1), TODAY.plusDays(6), null, 0);

        mockMvc.perform(get("/loans/management").param("search", "DOMAIN"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Domain-Driven Design"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Não pesquisa por autor nem encontra empréstimo devolvido")
    void doesNotSearchByAuthor_norFindReturnedLoans() throws Exception {
        saveStatusScenario();

        mockMvc.perform(get("/loans/management").param("search", "martin"))   // autor do Clean Code
                .andExpect(jsonPath("$.totalElements").value(0));

        mockMvc.perform(get("/loans/management").param("search", "T-004"))    // tombo do devolvido
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Combina status e pesquisa")
    void combinesStatusAndSearch() throws Exception {
        saveStatusScenario();
        saveLoan(saveCopy(domainDrivenDesign, "T-005"), otherReader,
                TODAY.minusDays(9), TODAY.minusDays(2), null, 0);   // atrasado de outro livro e leitor

        mockMvc.perform(get("/loans/management").param("status", "OVERDUE").param("search", "clean"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].accessionNumber").value("T-003"));

        mockMvc.perform(get("/loans/management").param("status", "ON_TIME").param("search", "domain"))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna 200 com lista vazia quando a pesquisa não tem resultado")
    void returnsEmptyList_whenSearchHasNoMatch() throws Exception {
        saveStatusScenario();

        mockMvc.perform(get("/loans/management").param("search", "zzzzzz"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna 400 quando size excede o limite de 100")
    void returnsBadRequest_whenSizeExceedsLimitInManagement() throws Exception {
        mockMvc.perform(get("/loans/management").param("size", "101"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithAnonymousUser
    @DisplayName("Retorna 401 quando o usuário não está autenticado")
    void returnsUnauthorized_whenUserIsNotAuthenticatedOnManagement() throws Exception {
        mockMvc.perform(get("/loans/management"))
                .andExpect(status().isUnauthorized());
    }

    // TESTES DE GET /loans/management/returns - Lista de devoluções

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna as devoluções com todos os campos")
    void returnsCompleteReturns_whenThereAreReturnedLoans() throws Exception {
        saveLoan(
                saveCopy(cleanCode, "T-001"),
                reader,
                TODAY.minusDays(10),
                TODAY.minusDays(3),
                TODAY.minusDays(2),
                0
        );

        mockMvc.perform(get("/loans/management/returns"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").exists())
                .andExpect(jsonPath("$.content[0].readerName").value("Leitora Um"))
                .andExpect(jsonPath("$.content[0].title").value("Clean Code"))
                .andExpect(jsonPath("$.content[0].accessionNumber").value("T-001"))
                .andExpect(jsonPath("$.content[0].returnDate").value("2026-10-13"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna devoluções paginadas quando page e size são informados")
    void returnsPagedReturns_whenPageAndSizeAreProvided() throws Exception {
        for (int i = 1; i <= 3; i++) {
            saveLoan(
                    saveCopy(cleanCode, "T-00" + i),
                    reader,
                    TODAY.minusDays(10),
                    TODAY.minusDays(3),
                    TODAY.minusDays(i),
                    0
            );
        }

        mockMvc.perform(get("/loans/management/returns")
                        .param("page", "0")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2));

        mockMvc.perform(get("/loans/management/returns")
                        .param("page", "1")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Ordena devoluções pela data mais recente e pelo maior ID")
    void returnsReturnsOrderedByReturnDateAndId() throws Exception {
        saveLoan(
                saveCopy(cleanCode, "T-001"),
                reader,
                TODAY.minusDays(10),
                TODAY.minusDays(3),
                TODAY.minusDays(3),
                0
        );

        saveLoan(
                saveCopy(cleanCode, "T-002"),
                reader,
                TODAY.minusDays(10),
                TODAY.minusDays(3),
                TODAY.minusDays(1),
                0
        );

        saveLoan(
                saveCopy(cleanCode, "T-003"),
                reader,
                TODAY.minusDays(10),
                TODAY.minusDays(3),
                TODAY.minusDays(1),
                0
        );

        mockMvc.perform(get("/loans/management/returns"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(3))
                .andExpect(jsonPath("$.content[0].accessionNumber").value("T-003"))
                .andExpect(jsonPath("$.content[1].accessionNumber").value("T-002"))
                .andExpect(jsonPath("$.content[2].accessionNumber").value("T-001"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Pesquisa devoluções pelo nome do leitor")
    void searchesReturnsByReaderName() throws Exception {
        saveLoan(
                saveCopy(cleanCode, "T-001"),
                reader,
                TODAY.minusDays(10),
                TODAY.minusDays(3),
                TODAY.minusDays(2),
                0
        );

        saveLoan(
                saveCopy(domainDrivenDesign, "T-002"),
                otherReader,
                TODAY.minusDays(10),
                TODAY.minusDays(3),
                TODAY.minusDays(1),
                0
        );

        mockMvc.perform(get("/loans/management/returns")
                        .param("search", "LEITORA UM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].readerName").value("Leitora Um"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Pesquisa devoluções pelo título do livro")
    void searchesReturnsByBookTitle() throws Exception {
        saveLoan(
                saveCopy(cleanCode, "T-001"),
                reader,
                TODAY.minusDays(10),
                TODAY.minusDays(3),
                TODAY.minusDays(2),
                0
        );

        saveLoan(
                saveCopy(domainDrivenDesign, "T-002"),
                otherReader,
                TODAY.minusDays(10),
                TODAY.minusDays(3),
                TODAY.minusDays(1),
                0
        );

        mockMvc.perform(get("/loans/management/returns")
                        .param("search", "DOMAIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Domain-Driven Design"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Pesquisa devoluções pelo número de tombo")
    void searchesReturnsByAccessionNumber() throws Exception {
        saveLoan(
                saveCopy(cleanCode, "T-001"),
                reader,
                TODAY.minusDays(10),
                TODAY.minusDays(3),
                TODAY.minusDays(2),
                0
        );

        saveLoan(
                saveCopy(domainDrivenDesign, "T-002"),
                otherReader,
                TODAY.minusDays(10),
                TODAY.minusDays(3),
                TODAY.minusDays(1),
                0
        );

        mockMvc.perform(get("/loans/management/returns")
                        .param("search", "t-002"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].accessionNumber").value("T-002"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Não retorna empréstimos ativos na listagem de devoluções")
    void doesNotReturnActiveLoans() throws Exception {
        // Empréstimo devolvido
        saveLoan(
                saveCopy(cleanCode, "T-001"),
                reader,
                TODAY.minusDays(10),
                TODAY.minusDays(3),
                TODAY.minusDays(2),
                0
        );

        // Empréstimo ativo
        saveLoan(
                saveCopy(domainDrivenDesign, "T-002"),
                otherReader,
                TODAY.minusDays(2),
                TODAY.plusDays(5),
                null,
                0
        );

        mockMvc.perform(get("/loans/management/returns"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].accessionNumber").value("T-001"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna lista vazia quando não existem devoluções")
    void returnsEmptyList_whenThereAreNoReturns() throws Exception {
        mockMvc.perform(get("/loans/management/returns"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0))
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.totalPages").value(0));
    }

    // TESTES DE POST /loans - Registro de empréstimo (bibliotecário)
    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna 201 com o empréstimo criado, grava o bibliotecário e muda o exemplar para ON_LOAN")
    void createsLoan_whenRequestIsValid() throws Exception {
        Copy copy = saveCopy(cleanCode, "T-001");

        postLoan(librarian, registerLoanJson(reader, "T-001", TODAY.plusDays(7)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.readerName").value("Leitora Um"))
                .andExpect(jsonPath("$.title").value("Clean Code"))
                .andExpect(jsonPath("$.accessionNumber").value("T-001"))
                .andExpect(jsonPath("$.loanDate").value("2026-10-15"))
                .andExpect(jsonPath("$.dueDate").value("2026-10-22"))
                .andExpect(jsonPath("$.renewalCount").value(0))
                .andExpect(jsonPath("$.status").value("ON_TIME"));

        assertEquals("ON_LOAN", jdbcTemplate.queryForObject(
                "select status from book_copies where id = ?", String.class, copy.getId()));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from loans where copy_id = ? and reader_id = ? and librarian_id = ? "
                        + "and loan_date = ? and return_date is null and renewal_count = 0",
                Integer.class, copy.getId(), reader, librarian, java.sql.Date.valueOf(TODAY)));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Aceita qualquer prazo posterior a hoje, sem impor os 7 dias do formulário")
    void acceptsAnyFutureDueDate() throws Exception {
        saveCopy(cleanCode, "T-001");

        postLoan(librarian, registerLoanJson(reader, "T-001", TODAY.plusDays(60)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dueDate").value("2026-12-14"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna 404 e não grava nada quando o leitor não existe")
    void returnsNotFound_whenReaderDoesNotExist() throws Exception {
        Copy copy = saveCopy(cleanCode, "T-001");

        postLoan(librarian, registerLoanJson(999_999, "T-001", TODAY.plusDays(7)))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Recurso não encontrado"));

        assertNothingWasSaved(copy);
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna 404 quando o usuário existe mas não tem perfil de leitor")
    void returnsNotFound_whenUserIsNotAReader() throws Exception {
        Copy copy = saveCopy(cleanCode, "T-001");

        postLoan(librarian, registerLoanJson(librarian, "T-001", TODAY.plusDays(7)))   // bibliotecário como "leitor"
                .andExpect(status().isNotFound());

        assertNothingWasSaved(copy);
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna 404 quando o tombo não existe")
    void returnsNotFound_whenAccessionNumberDoesNotExist() throws Exception {
        postLoan(librarian, registerLoanJson(reader, "NAO-EXISTE", TODAY.plusDays(7)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Recurso não encontrado"));

        assertEquals(0, jdbcTemplate.queryForObject("select count(*) from loans", Integer.class));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna 409 com o tombo quando o exemplar já está emprestado")
    void returnsConflict_whenCopyIsAlreadyOnLoan() throws Exception {
        Copy copy = saveCopy(cleanCode, "T-001");
        copy.setStatus(CopyStatus.ON_LOAN);
        copyRepository.save(copy);
        saveLoan(copy, otherReader, TODAY.minusDays(2), TODAY.plusDays(5), null, 0);

        postLoan(librarian, registerLoanJson(reader, "T-001", TODAY.plusDays(7)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Exemplar já emprestado"))
                .andExpect(jsonPath("$.accessionNumber").value("T-001"));

        // continua só o empréstimo anterior, do outro leitor
        assertEquals(1, jdbcTemplate.queryForObject("select count(*) from loans", Integer.class));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from loans where reader_id = ?", Integer.class, otherReader));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna 400 apontando dueDate quando a data é hoje, anterior a hoje ou está ausente")
    void returnsBadRequest_whenDueDateIsInvalid() throws Exception {
        Copy copy = saveCopy(cleanCode, "T-001");

        postLoan(librarian, registerLoanJson(reader, "T-001", TODAY))                  // igual a hoje
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Dados inválidos"))
                .andExpect(jsonPath("$.errors[*].field", hasItem("dueDate")));

        postLoan(librarian, registerLoanJson(reader, "T-001", TODAY.minusDays(1)))     // anterior
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("dueDate")));

        postLoan(librarian, """
            {"readerId": %d, "accessionNumber": "T-001"}
            """.formatted(reader))                                                   // ausente
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("dueDate")));

        assertNothingWasSaved(copy);
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna 400 com a lista de campos inválidos quando o corpo é vazio")
    void returnsBadRequestWithErrorList_whenBodyIsEmpty() throws Exception {
        postLoan(librarian, "{}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItems("readerId", "accessionNumber", "dueDate")));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna 400 quando librarianId não é informado")
    void returnsBadRequest_whenLibrarianIdIsMissing() throws Exception {
        mockMvc.perform(post("/loans").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerLoanJson(reader, "T-001", TODAY.plusDays(7))))
                .andExpect(status().isBadRequest());
    }

    // métodos auxiliares para montar os dados

    // Cenário com os três status: 2 em dia (um vence hoje), 1 atrasado, 1 devolvido
    private void saveStatusScenario() {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(2), TODAY.plusDays(5), null, 0);   // em dia
        saveLoan(saveCopy(cleanCode, "T-002"), reader, TODAY.minusDays(7), TODAY, null, 0);                // vence hoje: ainda em dia
        saveLoan(saveCopy(cleanCode, "T-003"), reader, TODAY.minusDays(10), TODAY.minusDays(3), null, 0);  // atrasado
        saveLoan(saveCopy(cleanCode, "T-004"), reader, TODAY.minusDays(20), TODAY.minusDays(13),
                TODAY.minusDays(14), 0);                                                                   // devolvido
    }

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

    private Copy saveCopy(Book book, String accession) {
        Copy c = new Copy();
        c.setBook(book);
        c.setAccessionNumber(accession);
        c.setPhysicalLocation("A-01");
        c.setStatus(CopyStatus.AVAILABLE);
        return copyRepository.save(c);
    }

    // Usuário e empréstimo entram por SQL: o User ainda é provisório e a tabela exige vários campos
    private int saveUser(String name, String email, String profile) {
        return jdbcTemplate.queryForObject("""
                insert into users(name, email, password_hash, affiliation_type, profile)
                values (?, ?, 'hash', 'STUDENT', ?) returning id
                """, Integer.class, name, email, profile);
    }

    private void saveLoan(Copy copy, int readerId, LocalDate loanDate, LocalDate dueDate,
                          LocalDate returnDate, int renewalCount) {
        jdbcTemplate.update("""
                insert into loans(copy_id, reader_id, librarian_id, loan_date, due_date, return_date, renewal_count)
                values (?, ?, ?, ?, ?, ?, ?)
                """, copy.getId(), readerId, librarian, loanDate, dueDate, returnDate, renewalCount);
    }

    private ResultActions postLoan(int librarianId, String json) throws Exception {
        return mockMvc.perform(post("/loans")
                .param("librarianId", String.valueOf(librarianId))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    private String registerLoanJson(int readerId, String accessionNumber, LocalDate dueDate) {
        return """
            {"readerId": %d, "accessionNumber": "%s", "dueDate": "%s"}
            """.formatted(readerId, accessionNumber, dueDate);
    }

    // Nenhum empréstimo gravado e o exemplar continua disponível
    private void assertNothingWasSaved(Copy copy) {
        assertEquals(0, jdbcTemplate.queryForObject("select count(*) from loans", Integer.class));
        assertEquals("AVAILABLE", jdbcTemplate.queryForObject(
                "select status from book_copies where id = ?", String.class, copy.getId()));
    }
}