package br.edu.fatec.libee.backend.listener;

import br.edu.fatec.libee.backend.event.LoanRegisteredEvent;
import br.edu.fatec.libee.backend.service.EmailService;
import br.edu.fatec.libee.backend.service.EmailTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class LoanEmailNotificationListener {
    private final EmailService emailService;
    private final EmailTemplateService emailTemplateService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onLoanRegistered(LoanRegisteredEvent event) {
        try {
            String html = emailTemplateService.gerarTemplateConfirmacaoEmprestimo(
                    event.readerName(),
                    event.bookTitle(),
                    event.dueDate()
            );

            emailService.enviarEmail(
                    event.readerEmail(),
                    "Confirmação de Empréstimo - Biblioteca Libee",
                    html
            );
        } catch (Exception e) {
            log.error(
                    "Erro ao processar notificação do empréstimo ID {}: {}", event.loanId(), e.getMessage(), e
            );
        }
    }
}
