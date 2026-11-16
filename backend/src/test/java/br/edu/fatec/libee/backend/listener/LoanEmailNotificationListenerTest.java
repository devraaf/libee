package br.edu.fatec.libee.backend.listener;

import br.edu.fatec.libee.backend.event.LoanRegisteredEvent;
import br.edu.fatec.libee.backend.service.EmailService;
import br.edu.fatec.libee.backend.service.EmailTemplateService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoanEmailNotificationListenerTest {

    private static final String SUBJECT = "Confirmação de Empréstimo - Biblioteca Libee";

    @Mock EmailService emailService;
    @Mock EmailTemplateService emailTemplateService;
    @InjectMocks LoanEmailNotificationListener listener;

    private LoanRegisteredEvent registerEvent() {
        return new LoanRegisteredEvent(1, "Leitor teste", "leitor.teste@email.com", "Livro", LocalDate.of(2026, 12, 1));
    }

    @Test
    @DisplayName("Deve gerar o template de confirmação e solicitar o envio do e-mail")
    void shouldGenerateTemplateAndSendEmail() {
        LoanRegisteredEvent event = registerEvent();
        String expectedHtml = "<html>Confirmação de empréstimo</html>";
        when(emailTemplateService.gerarTemplateConfirmacaoEmprestimo(
                event.readerName(),
                event.bookTitle(),
                event.dueDate())
        ).thenReturn(expectedHtml);

        listener.onLoanRegistered(event);

        verify(emailTemplateService).gerarTemplateConfirmacaoEmprestimo(
                event.readerName(),
                event.bookTitle(),
                event.dueDate());
        verify(emailService).enviarEmail(event.readerEmail(), SUBJECT, expectedHtml);
    }

    @Test
    @DisplayName("Não deve enviar o e-mail quando ocorrer falha na geração do template")
    void shouldNotSendEmailWhenTemplateGenerationFails() {
        LoanRegisteredEvent event = registerEvent();

        when(emailTemplateService.gerarTemplateConfirmacaoEmprestimo(
                event.readerName(),
                event.bookTitle(),
                event.dueDate()
        )).thenThrow(new RuntimeException("Erro ao gerar template"));

        assertDoesNotThrow(() -> listener.onLoanRegistered(event));

        verify(emailTemplateService).gerarTemplateConfirmacaoEmprestimo(
                event.readerName(),
                event.bookTitle(),
                event.dueDate()
        );
        verifyNoInteractions(emailService);
    }

    @Test
    @DisplayName("Não deve propagar a exceção quando o envio do e-mail falhar")
    void shouldNotPropagateExceptionWhenEmailSendingFails() {
        LoanRegisteredEvent event = registerEvent();
        String html = "<html>Confirmação de empréstimo</html>";

        when(emailTemplateService.gerarTemplateConfirmacaoEmprestimo(
                event.readerName(),
                event.bookTitle(),
                event.dueDate()
        )).thenReturn(html);
        doThrow(new RuntimeException("Falha no Brevo"))
                .when(emailService).enviarEmail(event.readerEmail(), SUBJECT, html);

        assertDoesNotThrow(() -> listener.onLoanRegistered(event));

        verify(emailService).enviarEmail(event.readerEmail(), SUBJECT, html);
    }
}
