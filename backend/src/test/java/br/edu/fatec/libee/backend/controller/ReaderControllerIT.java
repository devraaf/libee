package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.AbstractIntegrationTest;
import br.edu.fatec.libee.backend.entity.Course;
import br.edu.fatec.libee.backend.entity.User;
import br.edu.fatec.libee.backend.enums.AffiliationType;
import br.edu.fatec.libee.backend.enums.UserProfile;
import br.edu.fatec.libee.backend.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;

import java.time.LocalDate;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WithMockUser(roles = "LIBRARIAN")
public class ReaderControllerIT extends AbstractIntegrationTest {

    @Autowired private StudentRepository studentRepository;
    private User librarian;
    private User reader;
    private User otherReader;
    // Data real: a vw_loans e o resumo calculam o atraso com a data atual, ao contrário do TODAY fixo do LoanControllerIT
    private static final LocalDate TODAY = LocalDate.now();

    @BeforeEach
    void setUp() {
        truncate("loans", "book_copies", "book_author", "books", "authors",
                "categories", "students", "users", "courses");
        librarian = testData.saveUser("biblio@test.com", UserProfile.LIBRARIAN);
        testData.saveUser("admin@test.com", UserProfile.ADMINISTRATOR);
    }

    // TESTES DE GET /readers - Lista de leitores do bibliotecário
    @Test
    @DisplayName("Lista os leitores com os dados de cada um")
    void listsReaders_withTheirData() throws Exception {
        saveReaders();

        mockMvc.perform(get("/readers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].name").value("Ana Silva"))
                .andExpect(jsonPath("$.content[1].name").value("Bruno Souza"))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.content[0].courseName").value(nullValue()))
                .andExpect(jsonPath("$.content[0].passwordHash").doesNotExist())
                .andExpect(jsonPath("$.content[0].email").value("ana@test.com"))
                .andExpect(jsonPath("$.content[0].phone").value("11999990000"));
    }

    @Test
    @DisplayName("Lista os leitores ordenados por nome, ignorando maiúsculas e minúsculas")
    void ordersReadersByName() throws Exception {
        testData.saveUser("carla dias", "carla@test.com", null, AffiliationType.EMPLOYEE, UserProfile.READER);
        testData.saveUser("Bruno Souza", "bruno@test.com", null, AffiliationType.EMPLOYEE, UserProfile.READER);
        testData.saveUser("Ana Silva", "ana@test.com", null, AffiliationType.EMPLOYEE, UserProfile.READER);

        mockMvc.perform(get("/readers"))
                .andExpect(jsonPath("$.content[0].name").value("Ana Silva"))
                .andExpect(jsonPath("$.content[1].name").value("Bruno Souza"))
                .andExpect(jsonPath("$.content[2].name").value("carla dias"));
    }

    @Test
    @DisplayName("Retorna a página e o total de páginas solicitados")
    void paginatesReaders() throws Exception {
        saveReaders();

        mockMvc.perform(get("/readers").param("page", "1").param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Bruno Souza"))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(1))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2));
    }

    @Test
    @DisplayName("Filtra leitores pelo nome")
    void filtersReadersByName() throws Exception {
        saveReaders();

        mockMvc.perform(get("/readers")
                        .param("search", "Ana"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Ana Silva"));
    }

    @Test
    @DisplayName("Pesquisa por e-mail sem diferenciar maiúsculas de minúsculas")
    void searchesByEmailIgnoringCase() throws Exception {
        saveReaders();

        mockMvc.perform(get("/readers").param("search", "ANA@TEST.COM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Ana Silva"));
    }

    @Test
    @DisplayName("Filtra leitores pelo tipo de vínculo")
    void filtersReadersByLinkType() throws Exception {
        saveReaders(AffiliationType.PROFESSOR);

        mockMvc.perform(get("/readers").param("linkType", "PROFESSOR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Ana Silva"));
    }

    @Test
    @DisplayName("Filtra leitores pelo curso")
    void filtersReadersByCourse() throws Exception {
        saveReaders(AffiliationType.STUDENT);
        Course course = testData.saveCourse("Engenharia de Software");
        testData.saveStudent(reader, course);

        mockMvc.perform(get("/readers").param("courseId", course.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Ana Silva"))
                .andExpect(jsonPath("$.content[0].courseName").value("Engenharia de Software"));
    }

    @Test
    @DisplayName("Filtra leitores pendentes pela situação calculada na view")
    void filtersReadersByPendingStatus() throws Exception {
        saveReaders();
        testData.saveLoan(reader, librarian, TODAY.minusDays(1), null);
        testData.saveLoan(otherReader, librarian, TODAY.plusDays(1), null);

        mockMvc.perform(get("/readers").param("status", "PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Ana Silva"))
                .andExpect(jsonPath("$.content[0].status").value("PENDING"));
    }

    @Test
    @DisplayName("Filtra leitores regulares pela situação calculada na view")
    void filtersReadersByRegularStatus() throws Exception {
        saveReaders();
        testData.saveLoan(reader, librarian, TODAY.minusDays(1), null);
        testData.saveLoan(otherReader, librarian, TODAY.plusDays(1), null);

        mockMvc.perform(get("/readers").param("status", "REGULAR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Bruno Souza"))
                .andExpect(jsonPath("$.content[0].status").value("REGULAR"));
    }

    @Test
    @DisplayName("Combina pesquisa, vínculo e situação")
    void combinesSearchLinkTypeAndStatusFilters() throws Exception {
        saveReaders(AffiliationType.PROFESSOR);
        testData.saveLoan(reader, librarian, TODAY.minusDays(1), null);
        testData.saveLoan(otherReader, librarian, TODAY.plusDays(1), null);

        mockMvc.perform(get("/readers")
                        .param("search", "ANA")
                        .param("linkType", "PROFESSOR")
                        .param("status", "PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Ana Silva"));
    }

    @Test
    @DisplayName("Retorna lista vazia quando a pesquisa não encontra leitores")
    void returnsEmptyList_whenSearchHasNoMatches() throws Exception {
        mockMvc.perform(get("/readers").param("search", "inexistente"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.totalPages").value(0));
    }

    @Test
    @DisplayName("Não lista bibliotecários nem administradores")
    void doesNotListLibrariansOrAdministrators() throws Exception {
        saveReaders();

        mockMvc.perform(get("/readers"))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[?(@.name == 'Usuário de Teste')]").isEmpty());
    }

    @Test
    @DisplayName("Retorna 400 para tipo de vínculo inválido")
    void returnsBadRequest_whenLinkTypeIsInvalid() throws Exception {
        mockMvc.perform(get("/readers").param("linkType", "INVALID"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Retorna 400 para situação inválida")
    void returnsBadRequest_whenStatusIsInvalid() throws Exception {
        mockMvc.perform(get("/readers").param("status", "INVALID"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Retorna quantidade de empréstimos ativos e situação regular ou pendente")
    void returnsActiveLoanCountAndReaderStatus() throws Exception {
        saveReaders();
        testData.saveLoan(reader, librarian, TODAY.plusDays(1), null);
        testData.saveLoan(reader, librarian, TODAY.minusDays(1), null);
        testData.saveLoan(reader, librarian, TODAY.minusDays(3), TODAY.minusDays(1));
        testData.saveLoan(otherReader, librarian, TODAY.plusDays(2), null);

        mockMvc.perform(get("/readers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].activeLoans").value(2))
                .andExpect(jsonPath("$.content[0].status").value("PENDING"))
                .andExpect(jsonPath("$.content[1].activeLoans").value(1))
                .andExpect(jsonPath("$.content[1].status").value("REGULAR"));
    }

    // TESTES DE GET /readers/summary - Resumo de leitores do bibliotecário
    @Test
    @DisplayName("Retorna 200 com todos os contadores zerados quando não há leitores")
    void returnsZeroCounters_whenThereAreNoReaders() throws Exception {
        mockMvc.perform(get("/readers/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalReaders").value(0))
                .andExpect(jsonPath("$.readersWithActiveLoans").value(0))
                .andExpect(jsonPath("$.readersWithOverdueLoans").value(0));
    }

    @Test
    @DisplayName("Conta o leitor uma vez, mesmo com vários empréstimos ativos e atrasados")
    void countsReaderOnce_whenReaderHasSeveralLoans() throws Exception {
        saveReaders();
        testData.saveLoan(reader, librarian, TODAY.plusDays(5), null);    // em dia
        testData.saveLoan(reader, librarian, TODAY.plusDays(3), null);    // em dia
        testData.saveLoan(reader, librarian, TODAY.minusDays(3), null);   // atrasado
        testData.saveLoan(reader, librarian, TODAY.minusDays(5), null);   // atrasado

        mockMvc.perform(get("/readers/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalReaders").value(2))           // reader e otherReader
                .andExpect(jsonPath("$.readersWithActiveLoans").value(1))
                .andExpect(jsonPath("$.readersWithOverdueLoans").value(1));
    }

    @Test
    @DisplayName("Conta o leitor sem empréstimo no total, mas não como ativo nem com pendência")
    void countsReaderWithoutLoansOnlyInTotal() throws Exception {
        saveReaders();

        mockMvc.perform(get("/readers/summary"))
                .andExpect(jsonPath("$.totalReaders").value(2))
                .andExpect(jsonPath("$.readersWithActiveLoans").value(0))
                .andExpect(jsonPath("$.readersWithOverdueLoans").value(0));
    }

    @Test
    @DisplayName("Não conta como ativo nem com pendência o leitor que só tem empréstimos devolvidos")
    void doesNotCountReaderWithOnlyReturnedLoans() throws Exception {
        saveReaders();
        testData.saveLoan(reader, librarian, TODAY.minusDays(13), TODAY.minusDays(14)); // devolvido no prazo
        testData.saveLoan(reader, librarian, TODAY.minusDays(8), TODAY.minusDays(2));   // devolvido com atraso

        mockMvc.perform(get("/readers/summary"))
                .andExpect(jsonPath("$.totalReaders").value(2))
                .andExpect(jsonPath("$.readersWithActiveLoans").value(0))
                .andExpect(jsonPath("$.readersWithOverdueLoans").value(0));
    }

    @Test
    @DisplayName("Não conta com pendência o leitor cujo empréstimo vence hoje")
    void doesNotCountAsPendingReader_whenLoanIsDueToday() throws Exception {
        saveReaders();
        testData.saveLoan(reader, librarian, TODAY, null);

        mockMvc.perform(get("/readers/summary"))
                .andExpect(jsonPath("$.readersWithActiveLoans").value(1))
                .andExpect(jsonPath("$.readersWithOverdueLoans").value(0));
    }

    @Test
    @DisplayName("Conta cada leitor separadamente: um em dia, um atrasado")
    void countsEachReaderSeparately() throws Exception {
        saveReaders();
        testData.saveLoan(reader, librarian, TODAY.plusDays(5), null);
        testData.saveLoan(otherReader, librarian, TODAY.minusDays(3), null);

        mockMvc.perform(get("/readers/summary"))
                .andExpect(jsonPath("$.totalReaders").value(2))
                .andExpect(jsonPath("$.readersWithActiveLoans").value(2))
                .andExpect(jsonPath("$.readersWithOverdueLoans").value(1));
    }

    @Test
    @DisplayName("Não conta o bibliotecário, mesmo ele constando como responsável pelos empréstimos")
    void doesNotCountLibrarian() throws Exception {
        saveReaders();
        testData.saveLoan(reader, librarian, TODAY.plusDays(5), null);

        mockMvc.perform(get("/readers/summary"))
                .andExpect(jsonPath("$.totalReaders").value(2))
                .andExpect(jsonPath("$.readersWithActiveLoans").value(1));
    }

    @Test
    @DisplayName("Não muda os contadores quando a pesquisa e os filtros da lista são enviados")
    void doesNotChangeCounters_whenSearchAndFiltersAreProvided() throws Exception {
        saveReaders();
        testData.saveLoan(reader, librarian, TODAY.minusDays(3), null);

        mockMvc.perform(get("/readers/summary")
                        .param("search", "inexistente")
                        .param("status", "REGULAR")
                        .param("linkType", "PROFESSOR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalReaders").value(2))
                .andExpect(jsonPath("$.readersWithActiveLoans").value(1))
                .andExpect(jsonPath("$.readersWithOverdueLoans").value(1));
    }

    private void saveReaders() {
        saveReaders(AffiliationType.EMPLOYEE);
    }

    private void saveReaders(AffiliationType readerAffiliation) {
        reader = testData.saveUser("Ana Silva", "ana@test.com", "11999990000",
                readerAffiliation, UserProfile.READER);
        otherReader = testData.saveUser("Bruno Souza", "bruno@test.com", null,
                AffiliationType.EMPLOYEE, UserProfile.READER);
    }
}