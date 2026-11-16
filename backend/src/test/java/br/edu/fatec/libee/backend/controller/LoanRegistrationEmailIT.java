package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.AbstractIntegrationTest;
import br.edu.fatec.libee.backend.entity.Author;
import br.edu.fatec.libee.backend.entity.Book;
import br.edu.fatec.libee.backend.entity.User;
import br.edu.fatec.libee.backend.enums.AffiliationType;
import br.edu.fatec.libee.backend.enums.CopyStatus;
import br.edu.fatec.libee.backend.enums.UserProfile;
import br.edu.fatec.libee.backend.service.EmailService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional(propagation = Propagation.NOT_SUPPORTED)
@WithMockUser(roles = "LIBRARIAN")
class LoanRegistrationEmailIT extends AbstractIntegrationTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 15);
    private static final String SUBJECT = "Confirmação de Empréstimo - Biblioteca Libee";
    private static final String EMAIL_PREFIX = "loan-email-it-";

    @TestConfiguration
    static class FixedClockConfig {
        @Bean
        @Primary
        Clock fixedClock() {
            ZoneId zone = ZoneId.of("America/Sao_Paulo");
            return Clock.fixed(TODAY.atTime(12, 0).atZone(zone).toInstant(), zone);
        }
    }

    @MockitoBean EmailService emailService;

    private Book cleanCode;
    private User reader;
    private User librarian;

    @BeforeEach
    void setUp() {
        cleanUp();

        var tecnologia = testData.saveCategory("Tecnologia");
        Author martin = testData.saveAuthor("Robert C. Martin");
        cleanCode = testData.saveBook("9780132350884", "Clean Code", tecnologia, martin);

        reader = testData.saveUser("Leitora Um", EMAIL_PREFIX + "leitora@test.com", null,
                AffiliationType.STUDENT, UserProfile.READER);
        librarian = testData.saveUser("Bibliotecário", EMAIL_PREFIX + "biblio@test.com", null,
                AffiliationType.EMPLOYEE, UserProfile.LIBRARIAN);
    }

    @AfterEach
    void tearDown() {
        cleanUp();
    }

    private void cleanUp() {
        truncate("loans", "book_copies", "book_author", "books", "authors", "categories");
        jdbcTemplate.update("delete from users where email like ?", EMAIL_PREFIX + "%");
    }

    @Test
    @DisplayName("Envia o e-mail de confirmação ao leitor com os dados do empréstimo criado")
    void sendsConfirmationEmail_whenLoanIsCreated() throws Exception {
        testData.saveCopy(cleanCode, "T-001", CopyStatus.AVAILABLE);

        postLoan(librarian, registerLoanJson(reader, "T-001", TODAY.plusDays(7)))
                .andExpect(status().isCreated());

        ArgumentCaptor<String> html = ArgumentCaptor.forClass(String.class);
        verify(emailService).enviarEmail(
                eq(EMAIL_PREFIX + "leitora@test.com"), eq(SUBJECT), html.capture());

        assertThat(html.getValue())
                .contains("Leitora Um")
                .contains("Clean Code")
                .contains("22/10/2026");
    }

    @Test
    @DisplayName("Não envia e-mail quando o exemplar já está emprestado (409)")
    void doesNotSendEmail_whenCopyIsAlreadyOnLoan() throws Exception {
        testData.saveCopy(cleanCode, "T-001", CopyStatus.ON_LOAN);

        postLoan(librarian, registerLoanJson(reader, "T-001", TODAY.plusDays(7)))
                .andExpect(status().isConflict());

        verifyNoInteractions(emailService);
    }

    @Test
    @DisplayName("Não envia e-mail quando o leitor ou o tombo não existem (404)")
    void doesNotSendEmail_whenReaderOrCopyNotFound() throws Exception {
        testData.saveCopy(cleanCode, "T-001", CopyStatus.AVAILABLE);

        postLoan(librarian, registerLoanJson(999_999, "T-001", TODAY.plusDays(7)))
                .andExpect(status().isNotFound());
        postLoan(librarian, registerLoanJson(reader, "NAO-EXISTE", TODAY.plusDays(7)))
                .andExpect(status().isNotFound());

        verifyNoInteractions(emailService);
    }

    @Test
    @DisplayName("Não envia e-mail quando a validação falha (400)")
    void doesNotSendEmail_whenRequestIsInvalid() throws Exception {
        testData.saveCopy(cleanCode, "T-001", CopyStatus.AVAILABLE);

        postLoan(librarian, registerLoanJson(reader, "T-001", TODAY))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(emailService);
    }

    private ResultActions postLoan(User librarian, String json) throws Exception {
        return mockMvc.perform(postJson("/loans", json).with(asLibrarian(librarian)));
    }

    private String registerLoanJson(User reader, String accessionNumber, LocalDate dueDate) {
        return registerLoanJson(reader.getId(), accessionNumber, dueDate);
    }

    private String registerLoanJson(Integer readerId, String accessionNumber, LocalDate dueDate) {
        return """
                {"readerId": %d, "accessionNumber": "%s", "dueDate": "%s"}
                """.formatted(readerId, accessionNumber, dueDate);
    }
}
