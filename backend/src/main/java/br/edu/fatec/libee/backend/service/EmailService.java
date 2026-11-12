package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.dto.request.BrevoEmailRequest;
import br.edu.fatec.libee.backend.dto.response.BrevoEmailResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Slf4j
@Service
public class EmailService {

    private final RestClient restClient;
    private final String fromEmail;
    private final String fromName;
    private final boolean enabled;

    public EmailService(
            @Value("${brevo.api-key:}") String apiKey,
            @Value("${brevo.from-email:contato.libee@gmail.com}") String fromEmail,
            @Value("${brevo.from-name: Libee}") String fromName) {
        this.fromEmail = fromEmail;
        this.fromName = fromName;
        this.enabled = apiKey != null && !apiKey.isBlank();
        this.restClient = RestClient.builder()
                .baseUrl("https://api.brevo.com/v3")
                .defaultHeader("api-key", apiKey)
                .build();
    }

    @Async
    public void enviarEmail(String destinatario, String assunto, String htmlContent) {
        if (!enabled) {
            log.warn("BREVO_API_KEY não configurada. E-mail para {} não enviado.", destinatario);
            return;
        }

        BrevoEmailRequest requestPayload = new BrevoEmailRequest(
                new BrevoEmailRequest.Sender(fromName, fromEmail),
                List.of(new BrevoEmailRequest.Recipient(destinatario)),
                assunto,
                htmlContent
        );

        try {
            log.info("Iniciando o envio assíncrono de e-mail para: {}", destinatario);

            BrevoEmailResponse response = restClient.post()
                    .uri("/smtp/email")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestPayload)
                    .retrieve()
                    .body(BrevoEmailResponse.class);

            log.info("E-mail enviado com sucesso via Brevo! Message ID: {}", response != null ? response.messageId() : "N/A");
        } catch (Exception e) {
            log.error("Falha ao enviar e-mail via Brevo para {}: {}", destinatario, e.getMessage(), e);
        }
    }
}