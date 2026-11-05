package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.AbstractIntegrationTest;
import br.edu.fatec.libee.backend.entity.User;
import br.edu.fatec.libee.backend.enums.UserProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.test.context.support.WithMockUser;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WithMockUser(roles = "LIBRARIAN")
public class ReaderControllerIT extends AbstractIntegrationTest {

    private User librarian;
    private User reader;
    private User otherReader;
    private static final LocalDate TODAY = LocalDate.now();

    @BeforeEach
    void setUp() {
        truncate("loans", "book_copies", "book_author", "books", "authors",
                "categories", "students", "users", "courses");
        librarian = testData.saveUser("biblio@test.com", UserProfile.LIBRARIAN);
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
        reader = testData.saveUser("ana@test.com", UserProfile.READER);
        otherReader = testData.saveUser("bruno@test.com", UserProfile.READER);
    }
}
