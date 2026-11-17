package br.edu.fatec.libee.backend.listener;

import br.edu.fatec.libee.backend.AbstractIntegrationTest;
import br.edu.fatec.libee.backend.event.LoanRegisteredEvent;
import br.edu.fatec.libee.backend.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@Transactional(propagation = Propagation.NOT_SUPPORTED)
class LoanEmailNotificationListenerIT extends AbstractIntegrationTest {

    private static final String SUBJECT = "Confirmação de Empréstimo - Biblioteca Libee";

    @Autowired ApplicationEventPublisher eventPublisher;
    @Autowired PlatformTransactionManager transactionManager;

    @MockitoBean EmailService emailService;

    private TransactionTemplate transactionTemplate;

    @BeforeEach
    void setUp() {
        transactionTemplate = new TransactionTemplate(transactionManager);
    }

    private LoanRegisteredEvent registerEvent() {
        return new LoanRegisteredEvent(
                1, "Leitor teste", "leitor.teste@email.com", "Livro de teste", LocalDate.of(2026, 12, 1));
    }

    @Test
    @DisplayName("Deve enviar o e-mail após o commit da transação")
    void shouldSendEmailAfterCommit() {
        transactionTemplate.executeWithoutResult(status ->
                eventPublisher.publishEvent(registerEvent()));

        ArgumentCaptor<String> html = ArgumentCaptor.forClass(String.class);
        verify(emailService).enviarEmail(eq("leitor.teste@email.com"), eq(SUBJECT), html.capture());

        assertThat(html.getValue())
                .contains("Leitor teste")
                .contains("Livro de teste")
                .contains("01/12/2026");
    }

    @Test
    @DisplayName("Não deve enviar o e-mail quando a transação é marcada para rollback")
    void shouldNotSendEmailWhenTransactionIsMarkedForRollback() {
        transactionTemplate.executeWithoutResult(status -> {
            eventPublisher.publishEvent(registerEvent());
            status.setRollbackOnly();
        });

        verifyNoInteractions(emailService);
    }

    @Test
    @DisplayName("Não deve enviar o e-mail quando a transação falha com exceção")
    void shouldNotSendEmailWhenTransactionThrowsException() {
        assertThrows(IllegalStateException.class, () ->
                transactionTemplate.executeWithoutResult(status -> {
                    eventPublisher.publishEvent(registerEvent());
                    throw new IllegalStateException("Falha após publicar o evento");
                }));

        verifyNoInteractions(emailService);
    }

    @Test
    @DisplayName("Não deve enviar o e-mail quando o evento é publicado fora de uma transação")
    void shouldNotSendEmailWhenNoTransactionIsActive() {
        eventPublisher.publishEvent(registerEvent());

        verifyNoInteractions(emailService);
    }

    @Test
    @DisplayName("Falha no envio do e-mail não deve afetar nem propagar para a transação já commitada")
    void shouldNotPropagateEmailFailureAfterCommit() {
        doThrow(new RuntimeException("Falha no Brevo"))
                .when(emailService).enviarEmail(anyString(), anyString(), anyString());

        assertDoesNotThrow(() -> transactionTemplate.executeWithoutResult(status ->
                eventPublisher.publishEvent(registerEvent())));

        verify(emailService).enviarEmail(eq("leitor.teste@email.com"), eq(SUBJECT), anyString());
    }
}
