package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.AbstractIntegrationTest;
import br.edu.fatec.libee.backend.entity.*;
import br.edu.fatec.libee.backend.enums.AffiliationType;
import br.edu.fatec.libee.backend.enums.CopyStatus;
import br.edu.fatec.libee.backend.enums.UserProfile;
import br.edu.fatec.libee.backend.repository.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.ResultActions;

import java.sql.Date;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WithMockUser(roles = "READER")
public class LoanControllerIT extends AbstractIntegrationTest {

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

    @Autowired BookRepository bookRepository;

    private Author evans;
    private Book cleanCode;
    private Book domainDrivenDesign;
    private User reader;
    private User otherReader;
    private User librarian;

    @BeforeEach
    void setUp() {
        // Esvazia acervo e empréstimos para o teste não depender de dados pré-existentes
        truncate("loans", "book_copies", "book_author", "books", "authors", "categories");

        var tecnologia = testData.saveCategory("Tecnologia");
        Author martin = testData.saveAuthor("Robert C. Martin");
        evans = testData.saveAuthor("Eric Evans");
        cleanCode = testData.saveBook("9780132350884", "Clean Code", tecnologia, martin);
        domainDrivenDesign = testData.saveBook("9780321125217", "Domain-Driven Design", tecnologia, evans);

        reader = testData.saveUser("Leitora Um", "loan-it-leitora1@test.com", null,
                AffiliationType.STUDENT, UserProfile.READER);
        otherReader = testData.saveUser("Leitor Dois", "loan-it-leitor2@test.com", null,
                AffiliationType.STUDENT, UserProfile.READER);
        librarian = testData.saveUser("Bibliotecário", "loan-it-biblio@test.com", null,
                AffiliationType.EMPLOYEE, UserProfile.LIBRARIAN);
    }

    // TESTES DE GET /loans - Lista de empréstimos do leitor
    @Test
    @DisplayName("Retorna todos os campos do empréstimo, com livro, tombo e datas")
    void returnsCompleteLoan_whenReaderHasLoan() throws Exception {
        Copy copy = saveCopy(cleanCode, "T-001");
        saveLoan(copy, reader, TODAY.minusDays(3), TODAY.plusDays(4), null, 1);

        mockMvc.perform(get("/loans").with(asReader(reader)))
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

        mockMvc.perform(get("/loans").with(asReader(reader)))
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

        mockMvc.perform(get("/loans")
                        .with(asReader(reader))
                        .param("page", "0").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2));

        mockMvc.perform(get("/loans")
                        .with(asReader(reader))
                        .param("page", "1").param("size", "2"))
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    // FILTRO POR STATUS
    @Test
    @DisplayName("Retorna só os empréstimos em dia quando status é ON_TIME, incluindo o que vence hoje")
    void returnsOnlyOnTimeLoans_whenStatusIsOnTime() throws Exception {
        saveStatusScenario();

        mockMvc.perform(get("/loans")
                        .with(asReader(reader))
                        .param("status", "ON_TIME"))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[*].status").value(everyItem(is("ON_TIME"))));
    }

    @Test
    @DisplayName("Retorna só os empréstimos atrasados quando status é OVERDUE")
    void returnsOnlyOverdueLoans_whenStatusIsOverdue() throws Exception {
        saveStatusScenario();

        mockMvc.perform(get("/loans")
                        .with(asReader(reader))
                        .param("status", "OVERDUE"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].status").value("OVERDUE"))
                .andExpect(jsonPath("$.content[0].dueDate").value("2026-10-12"));
    }

    @Test
    @DisplayName("Retorna só os empréstimos devolvidos quando status é RETURNED")
    void returnsOnlyReturnedLoans_whenStatusIsReturned() throws Exception {
        saveStatusScenario();

        mockMvc.perform(get("/loans")
                        .with(asReader(reader))
                        .param("status", "RETURNED"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].status").value("RETURNED"))
                .andExpect(jsonPath("$.content[0].returnDate").value("2026-10-01"));
    }

    @Test
    @DisplayName("Retorna os empréstimos ativos quando status é enviado mais de uma vez")
    void returnsActiveLoans_whenMultipleStatusesAreProvided() throws Exception {
        saveStatusScenario();

        mockMvc.perform(get("/loans")
                        .with(asReader(reader))
                        .param("status", "ON_TIME", "OVERDUE"))
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    @Test
    @DisplayName("Retorna 400 quando status não é um valor válido")
    void returnsBadRequest_whenStatusIsInvalid() throws Exception {
        mockMvc.perform(get("/loans")
                        .with(asReader(reader))
                        .param("status", "INVALIDO"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.timestamp").exists());
    }

    // BUSCA
    @Test
    @DisplayName("Retorna o empréstimo correspondente ao buscar por título")
    void returnsMatchingLoan_whenSearchingByTitle() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(1), TODAY.plusDays(6), null, 0);
        saveLoan(saveCopy(domainDrivenDesign, "T-002"), reader, TODAY.minusDays(2), TODAY.plusDays(5), null, 0);

        mockMvc.perform(get("/loans")
                        .with(asReader(reader))
                        .param("search", "CLEAN"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].book.title").value("Clean Code"));
    }

    @Test
    @DisplayName("Retorna o empréstimo correspondente ao buscar pelo nome do autor")
    void returnsMatchingLoan_whenSearchingByAuthorName() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(1), TODAY.plusDays(6), null, 0);
        saveLoan(saveCopy(domainDrivenDesign, "T-002"), reader, TODAY.minusDays(2), TODAY.plusDays(5), null, 0);

        mockMvc.perform(get("/loans")
                        .with(asReader(reader))
                        .param("search", "evans"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].book.title").value("Domain-Driven Design"));
    }

    @Test
    @DisplayName("Retorna lista vazia quando a busca casa mas o status não")
    void returnsEmptyList_whenSearchMatchesButStatusDoesNot() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(1), TODAY.plusDays(6), null, 0);

        mockMvc.perform(get("/loans")
                        .with(asReader(reader))
                        .param("search", "clean")
                        .param("status", "OVERDUE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    // LISTA VAZIA E ISOLAMENTO
    @Test
    @DisplayName("Retorna 200 com lista vazia quando o leitor não tem empréstimos")
    void returnsEmptyList_whenReaderHasNoLoans() throws Exception {
        mockMvc.perform(get("/loans").with(asReader(reader)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @DisplayName("Usa o leitor autenticado e ignora readerId enviado na query")
    void doesNotReturnLoansOfAnotherReader() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(1), TODAY.plusDays(6), null, 0);
        saveLoan(saveCopy(domainDrivenDesign, "T-002"), otherReader, TODAY.minusDays(1), TODAY.plusDays(6), null, 0);

        mockMvc.perform(get("/loans")
                        .with(asReader(reader))
                        .param("readerId", String.valueOf(otherReader.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].book.title").value("Clean Code"));

        mockMvc.perform(get("/loans").with(asReader(otherReader)))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].book.title").value("Domain-Driven Design"));
    }

    // VALIDAÇÃO
    @Test
    @DisplayName("Retorna 400 quando size é zero")
    void returnsBadRequest_whenSizeIsZero() throws Exception {
        mockMvc.perform(get("/loans").param("size", "0")
                        .with(asReader(reader)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Retorna 400 quando size excede o limite de 100")
    void returnsBadRequest_whenSizeExceedsLimit() throws Exception {
        mockMvc.perform(get("/loans").param("size", "101")
                        .with(asReader(reader)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Retorna 400 quando page é negativo")
    void returnsBadRequest_whenPageIsNegative() throws Exception {
        mockMvc.perform(get("/loans").param("page", "-1")
                        .with(asReader(reader)))
                .andExpect(status().isBadRequest());
    }

    // TESTES DE GET /loans/upcoming-returns - Próximas devoluções do leitor
    @Test
    @DisplayName("Retorna id, título, autores, ano, capa e data prevista de cada item, sem status")
    void returnsUpcomingReturnFields_whenReaderHasActiveLoan() throws Exception {
        cleanCode.setCoverImageUrl("https://example.com/covers/clean-code.jpg");
        cleanCode.setPublicationYear(2008);
        bookRepository.save(cleanCode);
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(2), TODAY.plusDays(5), null, 0);

        mockMvc.perform(get("/loans/upcoming-returns").with(asReader(reader)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").exists())
                .andExpect(jsonPath("$[0].bookId").value(cleanCode.getId()))
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

        mockMvc.perform(get("/loans/upcoming-returns").with(asReader(reader)))
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

        mockMvc.perform(get("/loans/upcoming-returns").with(asReader(reader)))
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

        mockMvc.perform(get("/loans/upcoming-returns").with(asReader(reader)))
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

        mockMvc.perform(get("/loans/upcoming-returns").with(asReader(reader)))
                .andExpect(jsonPath("$.length()").value(3));
    }

    @Test
    @DisplayName("Respeita o limit informado e mantém os mais próximos")
    void respectsLimit_whenLimitIsProvided() throws Exception {
        for (int i = 1; i <= 4; i++) {
            saveLoan(saveCopy(cleanCode, "T-00" + i), reader, TODAY.minusDays(2), TODAY.plusDays(i), null, 0);
        }

        mockMvc.perform(get("/loans/upcoming-returns")
                        .with(asReader(reader))
                        .param("limit", "2"))
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

        mockMvc.perform(get("/loans/upcoming-returns").with(asReader(reader)))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].dueDate").value("2026-10-20"));
    }

    @Test
    @DisplayName("Retorna 200 com lista vazia quando o leitor não tem empréstimos ativos")
    void returnsEmptyList_whenReaderHasNoActiveLoans() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(20), TODAY.minusDays(13),
                TODAY.minusDays(14), 0);                                                            // só devolvido

        mockMvc.perform(get("/loans/upcoming-returns").with(asReader(reader)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("Usa o leitor autenticado e ignora readerId enviado na query")
    void doesNotReturnUpcomingReturnsOfAnotherReader() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(2), TODAY.plusDays(5), null, 0);
        saveLoan(saveCopy(domainDrivenDesign, "T-002"), otherReader, TODAY.minusDays(2), TODAY.plusDays(1), null, 0);

        mockMvc.perform(get("/loans/upcoming-returns")
                        .with(asReader(reader))
                        .param("readerId", String.valueOf(otherReader.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Clean Code"));
    }

    @Test
    @DisplayName("Retorna 400 quando limit é zero ou excede o máximo")
    void returnsBadRequest_whenLimitIsOutOfRange() throws Exception {
        mockMvc.perform(get("/loans/upcoming-returns")
                        .with(asReader(reader))
                        .param("limit", "0"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/loans/upcoming-returns")
                        .with(asReader(reader))
                        .param("limit", "6"))
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
                .andExpect(jsonPath("$.content[*].status", not(hasItem("RETURNED"))));
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

    // TESTES DE GET /loans/management/returns - Lista de devoluções

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna as devoluções com todos os campos")
    void returnsCompleteReturns_whenThereAreReturnedLoans() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(10), TODAY.minusDays(3), TODAY.minusDays(2), 0);

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
            saveLoan(saveCopy(cleanCode, "T-00" + i), reader,
                    TODAY.minusDays(10), TODAY.minusDays(3), TODAY.minusDays(i), 0);
        }

        mockMvc.perform(get("/loans/management/returns").param("page", "0").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2));

        mockMvc.perform(get("/loans/management/returns").param("page", "1").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Ordena devoluções pela data mais recente e pelo maior ID")
    void returnsReturnsOrderedByReturnDateAndId() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(10), TODAY.minusDays(3), TODAY.minusDays(3), 0);
        saveLoan(saveCopy(cleanCode, "T-002"), reader, TODAY.minusDays(10), TODAY.minusDays(3), TODAY.minusDays(1), 0);
        saveLoan(saveCopy(cleanCode, "T-003"), reader, TODAY.minusDays(10), TODAY.minusDays(3), TODAY.minusDays(1), 0);

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
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(10), TODAY.minusDays(3), TODAY.minusDays(2), 0);
        saveLoan(saveCopy(domainDrivenDesign, "T-002"), otherReader,
                TODAY.minusDays(10), TODAY.minusDays(3), TODAY.minusDays(1), 0);

        mockMvc.perform(get("/loans/management/returns").param("search", "LEITORA UM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].readerName").value("Leitora Um"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Pesquisa devoluções pelo título do livro")
    void searchesReturnsByBookTitle() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(10), TODAY.minusDays(3), TODAY.minusDays(2), 0);
        saveLoan(saveCopy(domainDrivenDesign, "T-002"), otherReader,
                TODAY.minusDays(10), TODAY.minusDays(3), TODAY.minusDays(1), 0);

        mockMvc.perform(get("/loans/management/returns").param("search", "DOMAIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Domain-Driven Design"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Pesquisa devoluções pelo número de tombo")
    void searchesReturnsByAccessionNumber() throws Exception {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(10), TODAY.minusDays(3), TODAY.minusDays(2), 0);
        saveLoan(saveCopy(domainDrivenDesign, "T-002"), otherReader,
                TODAY.minusDays(10), TODAY.minusDays(3), TODAY.minusDays(1), 0);

        mockMvc.perform(get("/loans/management/returns").param("search", "t-002"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].accessionNumber").value("T-002"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Não retorna empréstimos ativos na listagem de devoluções")
    void doesNotReturnActiveLoans() throws Exception {
        // Empréstimo devolvido
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(10), TODAY.minusDays(3), TODAY.minusDays(2), 0);
        // Empréstimo ativo
        saveLoan(saveCopy(domainDrivenDesign, "T-002"), otherReader, TODAY.minusDays(2), TODAY.plusDays(5), null, 0);

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
                Integer.class, copy.getId(), reader.getId(), librarian.getId(), Date.valueOf(TODAY)));
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
        Copy copy = testData.saveCopy(cleanCode, "T-001", CopyStatus.ON_LOAN);
        saveLoan(copy, otherReader, TODAY.minusDays(2), TODAY.plusDays(5), null, 0);

        postLoan(librarian, registerLoanJson(reader, "T-001", TODAY.plusDays(7)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Exemplar já emprestado"))
                .andExpect(jsonPath("$.accessionNumber").value("T-001"));

        // continua só o empréstimo anterior, do outro leitor
        assertEquals(1, jdbcTemplate.queryForObject("select count(*) from loans", Integer.class));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from loans where reader_id = ?", Integer.class, otherReader.getId()));
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
                """.formatted(reader.getId()))                                         // ausente
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
    @DisplayName("Usa o bibliotecário autenticado, mesmo se librarianId vier na query")
    void usesAuthenticatedLibrarian_whenLibrarianIdQueryParameterIsProvided() throws Exception {
        saveCopy(cleanCode, "T-001");

        mockMvc.perform(postJson("/loans", registerLoanJson(reader, "T-001", TODAY.plusDays(7)))
                        .with(asLibrarian(librarian))
                        .param("librarianId", String.valueOf(reader.getId())))
                .andExpect(status().isCreated());

        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from loans where librarian_id = ?", Integer.class, librarian.getId()));
    }

    // TESTES DE POST /loans/returns - Registro de devolução (bibliotecário)
    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna 200 com o empréstimo devolvido, grava a data atual e libera o exemplar")
    void returnsLoan_whenLoanIsOnTime() throws Exception {
        Copy copy = saveCopyOnLoan(cleanCode, "T-001", reader, TODAY.minusDays(3), TODAY.plusDays(4));

        postReturn(returnJson("T-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.readerName").value("Leitora Um"))
                .andExpect(jsonPath("$.title").value("Clean Code"))
                .andExpect(jsonPath("$.accessionNumber").value("T-001"))
                .andExpect(jsonPath("$.returnDate").value("2026-10-15"));

        assertEquals("AVAILABLE", jdbcTemplate.queryForObject(
                "select status from book_copies where id = ?", String.class, copy.getId()));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from loans where copy_id = ? and return_date = ?",
                Integer.class, copy.getId(), Date.valueOf(TODAY)));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Aceita a devolução de empréstimo atrasado e o status final é RETURNED")
    void returnsLoan_whenLoanIsOverdue() throws Exception {
        Copy copy = saveCopyOnLoan(cleanCode, "T-001", reader, TODAY.minusDays(10), TODAY.minusDays(3));

        postReturn(returnJson("T-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.returnDate").value("2026-10-15"));

        assertEquals("AVAILABLE", jdbcTemplate.queryForObject(
                "select status from book_copies where id = ?", String.class, copy.getId()));

        // O status final é derivado das datas: o histórico do leitor mostra RETURNED, com o vencimento original.
        // A consulta é feita pelo próprio leitor (o id vem do token)
        mockMvc.perform(get("/loans")
                        .with(asReader(reader))
                        .param("status", "RETURNED"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].status").value("RETURNED"))
                .andExpect(jsonPath("$.content[0].dueDate").value("2026-10-12"))
                .andExpect(jsonPath("$.content[0].returnDate").value("2026-10-15"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna 404 quando o tombo não existe")
    void returnsNotFound_whenAccessionNumberDoesNotExistOnReturn() throws Exception {
        postReturn(returnJson("NAO-EXISTE"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Recurso não encontrado"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna 409 com o tombo quando o exemplar não tem empréstimo ativo")
    void returnsConflict_whenCopyHasNoActiveLoan() throws Exception {
        saveCopy(cleanCode, "T-001");   // AVAILABLE, nunca emprestado

        postReturn(returnJson("T-001"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Exemplar sem empréstimo ativo"))
                .andExpect(jsonPath("$.accessionNumber").value("T-001"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna 409 ao devolver pela segunda vez o mesmo exemplar")
    void returnsConflict_whenCopyIsReturnedTwice() throws Exception {
        saveCopyOnLoan(cleanCode, "T-001", reader, TODAY.minusDays(3), TODAY.plusDays(4));

        postReturn(returnJson("T-001")).andExpect(status().isOk());
        postReturn(returnJson("T-001"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Exemplar sem empréstimo ativo"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("A devolução aparece em /loans/management/returns e sai de /loans/management")
    void returnAppearsInReturnsList_andLeavesActiveList() throws Exception {
        saveCopyOnLoan(cleanCode, "T-001", reader, TODAY.minusDays(3), TODAY.plusDays(4));

        mockMvc.perform(get("/loans/management/returns"))
                .andExpect(jsonPath("$.totalElements").value(0));
        mockMvc.perform(get("/loans/management"))
                .andExpect(jsonPath("$.totalElements").value(1));

        postReturn(returnJson("T-001")).andExpect(status().isOk());

        mockMvc.perform(get("/loans/management/returns"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].accessionNumber").value("T-001"));
        mockMvc.perform(get("/loans/management"))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Permite emprestar de novo o exemplar depois da devolução")
    void allowsNewLoan_afterReturn() throws Exception {
        saveCopyOnLoan(cleanCode, "T-001", reader, TODAY.minusDays(3), TODAY.plusDays(4));

        postReturn(returnJson("T-001")).andExpect(status().isOk());

        postLoan(librarian, registerLoanJson(otherReader, "T-001", TODAY.plusDays(7)))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    @DisplayName("Retorna 400 apontando accessionNumber quando o tombo está ausente ou em branco")
    void returnsBadRequest_whenAccessionNumberIsMissingOnReturn() throws Exception {
        postReturn("{}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("accessionNumber")));

        postReturn(returnJson("   "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("accessionNumber")));
    }

    // TESTES DE PATCH /loans/{id}/renewals - Renovação de empréstimo (leitor)
    // TESTES DE PATCH /loans/{id} - Renovação de empréstimo (leitor)
    @Test
    @DisplayName("Retorna 200 com o empréstimo atualizado, soma 7 dias ao vencimento e incrementa as renovações")
    void renewsLoan_whenLoanIsOnTime() throws Exception {
        Copy copy = saveCopy(cleanCode, "T-001");
        int loanId = saveLoan(copy, reader, TODAY.minusDays(3), TODAY.plusDays(4), null, 0).getId();

        patchRenewal(loanId, reader)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(loanId))
                .andExpect(jsonPath("$.book.title").value("Clean Code"))
                .andExpect(jsonPath("$.accessionNumber").value("T-001"))
                .andExpect(jsonPath("$.loanDate").value("2026-10-12"))
                .andExpect(jsonPath("$.dueDate").value("2026-10-26"))   // 19/10 + 7, e não hoje + 7
                .andExpect(jsonPath("$.returnDate").value(nullValue()))
                .andExpect(jsonPath("$.renewalCount").value(1))
                .andExpect(jsonPath("$.status").value("ON_TIME"));

        assertLoanState(loanId, TODAY.plusDays(11), 1);
    }

    @Test
    @DisplayName("Renova o empréstimo que vence hoje, porque ainda não está atrasado")
    void renewsLoan_whenLoanDueTodayIsStillOnTime() throws Exception {
        Copy copy = saveCopy(cleanCode, "T-001");
        int loanId = saveLoan(copy, reader, TODAY.minusDays(7), TODAY, null, 0).getId();

        patchRenewal(loanId, reader)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueDate").value("2026-10-22"))
                .andExpect(jsonPath("$.renewalCount").value(1));
    }

    @Test
    @DisplayName("Retorna 404 sem alterações quando o empréstimo é de outro leitor, mesmo com readerId na query")
    void returnsNotFound_whenLoanBelongsToAnotherReader() throws Exception {
        Copy copy = saveCopy(cleanCode, "T-001");
        int loanId = saveLoan(copy, otherReader, TODAY.minusDays(3), TODAY.plusDays(4), null, 0).getId();

        mockMvc.perform(patch("/loans/{id}", loanId)
                        .with(asReader(reader))
                        .param("readerId", String.valueOf(otherReader.getId())))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));

        assertLoanState(loanId, TODAY.plusDays(4), 0);
    }

    @Test
    @DisplayName("Retorna 404 quando o empréstimo não existe")
    void returnsNotFound_whenLoanDoesNotExist() throws Exception {
        patchRenewal(999_999, reader)
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Retorna 409 e não altera nada quando o empréstimo já foi devolvido")
    void returnsConflict_whenLoanIsAlreadyReturned() throws Exception {
        Copy copy = saveCopy(cleanCode, "T-001");
        int loanId = saveLoan(copy, reader, TODAY.minusDays(10), TODAY.plusDays(2), TODAY.minusDays(1), 0).getId();

        patchRenewal(loanId, reader)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Empréstimo não renovável"));

        assertLoanState(loanId, TODAY.plusDays(2), 0);
    }

    @Test
    @DisplayName("Retorna 409 e não altera nada quando o empréstimo está atrasado")
    void returnsConflict_whenLoanIsOverdue() throws Exception {
        Copy copy = saveCopy(cleanCode, "T-001");
        int loanId = saveLoan(copy, reader, TODAY.minusDays(10), TODAY.minusDays(3), null, 0).getId();

        patchRenewal(loanId, reader)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Empréstimo não renovável"));

        assertLoanState(loanId, TODAY.minusDays(3), 0);
    }

    @Test
    @DisplayName("Retorna 400 quando o id não é numérico")
    void returnsBadRequest_whenIdIsNotNumeric() throws Exception {
        mockMvc.perform(patch("/loans/abc").with(asReader(reader)))
                .andExpect(status().isBadRequest());
    }

    // MÉTODOS AUXILIARES
    // Cenário com os três status: 2 em dia (um vence hoje), 1 atrasado, 1 devolvido
    private void saveStatusScenario() {
        saveLoan(saveCopy(cleanCode, "T-001"), reader, TODAY.minusDays(2), TODAY.plusDays(5), null, 0);   // em dia
        saveLoan(saveCopy(cleanCode, "T-002"), reader, TODAY.minusDays(7), TODAY, null, 0);                // vence hoje: ainda em dia
        saveLoan(saveCopy(cleanCode, "T-003"), reader, TODAY.minusDays(10), TODAY.minusDays(3), null, 0);  // atrasado
        saveLoan(saveCopy(cleanCode, "T-004"), reader, TODAY.minusDays(20), TODAY.minusDays(13),
                TODAY.minusDays(14), 0);                                                                   // devolvido
    }

    // Atalhos sobre o TestData, para os cenários ficarem legíveis:
    // o exemplar nasce disponível e o bibliotecário do empréstimo é sempre o da classe
    private Copy saveCopy(Book book, String accession) {
        return testData.saveCopy(book, accession, CopyStatus.AVAILABLE);
    }

    private Loan saveLoan(Copy copy, User reader, LocalDate loanDate, LocalDate dueDate,
                          LocalDate returnDate, int renewalCount) {
        return testData.saveLoan(copy, reader, librarian, loanDate, dueDate, returnDate, renewalCount);
    }

    // Exemplar emprestado de verdade: status ON_LOAN e empréstimo aberto
    private Copy saveCopyOnLoan(Book book, String accession, User reader, LocalDate loanDate, LocalDate dueDate) {
        Copy copy = testData.saveCopy(book, accession, CopyStatus.ON_LOAN);
        saveLoan(copy, reader, loanDate, dueDate, null, 0);
        return copy;
    }

    private ResultActions postLoan(User librarian, String json) throws Exception {
        return mockMvc.perform(postJson("/loans", json).with(asLibrarian(librarian)));
    }

    private ResultActions postReturn(String json) throws Exception {
        return mockMvc.perform(postJson("/loans/returns", json));
    }

    private ResultActions patchRenewal(int loanId, User reader) throws Exception {
        return mockMvc.perform(patch("/loans/{id}", loanId).with(asReader(reader)));
    }

    private String registerLoanJson(User reader, String accessionNumber, LocalDate dueDate) {
        return registerLoanJson(reader.getId(), accessionNumber, dueDate);
    }

    private String registerLoanJson(Integer readerId, String accessionNumber, LocalDate dueDate) {
        return """
                {"readerId": %d, "accessionNumber": "%s", "dueDate": "%s"}
                """.formatted(readerId, accessionNumber, dueDate);
    }

    private String returnJson(String accessionNumber) {
        return """
                {"accessionNumber": "%s"}
                """.formatted(accessionNumber);
    }

    // Nenhum empréstimo gravado e o exemplar continua disponível
    private void assertNothingWasSaved(Copy copy) {
        assertEquals(0, jdbcTemplate.queryForObject("select count(*) from loans", Integer.class));
        assertEquals("AVAILABLE", jdbcTemplate.queryForObject(
                "select status from book_copies where id = ?", String.class, copy.getId()));
    }

    // Confere no banco o vencimento e as renovações do empréstimo
    private void assertLoanState(int loanId, LocalDate dueDate, int renewalCount) {
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from loans where id = ? and due_date = ? and renewal_count = ?",
                Integer.class, loanId, Date.valueOf(dueDate), renewalCount));
    }
}