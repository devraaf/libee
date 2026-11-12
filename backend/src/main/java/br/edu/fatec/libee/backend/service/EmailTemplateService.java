package br.edu.fatec.libee.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class EmailTemplateService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public String gerarTemplateConfirmacaoEmprestimo(String nomeUsuario, String tituloLivro, LocalDate dataDevolucao) {
        String nomeSeguro = HtmlUtils.htmlEscape(nomeUsuario != null ? nomeUsuario : "Leitor(a)");
        String livroSeguro = HtmlUtils.htmlEscape(tituloLivro != null ? tituloLivro : "Livro");
        String dataFormatada = dataDevolucao != null ? dataDevolucao.format(DATE_FORMATTER) : "--/--/----";

        String urlLogo = "https://i.ibb.co/4RLW56BF/logo-libee.png";

        return """
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Confirmação de Empréstimo - Libee</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #121212; font-family: Arial, Helvetica, sans-serif; color: #e0e0e0; -webkit-text-size-adjust: 100%%; -ms-text-size-adjust: 100%%;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background-color: #121212; padding: 24px 12px;">
                        <tr>
                            <td align="center">
                                <!-- Container Principal Responsivo -->
                                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #1a1a1a; border-radius: 8px; overflow: hidden; border: 1px solid #333333; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
                                    
                                    <!-- Cabeçalho (Fundo Branco com Destaque Amarelo) -->
                                    <tr>
                                        <td style="background-color: #ffffff; padding: 28px 32px; text-align: center; border-bottom: 3px solid #facc15;">
                                            <img src="%s" alt="Biblioteca Libee" width="130" style="display: block; margin: 0 auto; max-width: 130px; height: auto; border: 0;">
                                            <p style="margin: 10px 0 0 0; font-size: 12px; color: #52525b; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
                                                Sistema de Gestão de Biblioteca
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Corpo do E-mail -->
                                    <tr>
                                        <td style="padding: 36px 32px;">
                                            <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #ffffff;">
                                                Olá, %s!
                                            </h2>
                                            <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #d4d4d8;">
                                                Seu empréstimo foi confirmado com sucesso em nosso sistema. Confira abaixo os detalhes da sua retirada:
                                            </p>

                                            <!-- Card com Dados do Empréstimo -->
                                            <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background-color: #242424; border: 1px solid #3f3f46; border-radius: 6px; margin-bottom: 24px;">
                                                <tr>
                                                    <td style="padding: 20px 24px;">
                                                        <p style="margin: 0 0 14px 0; font-size: 14px; color: #a1a1aa;">
                                                            <strong style="color: #facc15; display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Título do Livro</strong>
                                                            <span style="font-size: 17px; color: #ffffff; font-weight: bold;">%s</span>
                                                        </p>
                                                        <hr style="border: 0; border-top: 1px solid #3f3f46; margin: 14px 0;">
                                                        <p style="margin: 0; font-size: 14px; color: #a1a1aa;">
                                                            <strong style="color: #facc15; display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Data Limite de Devolução</strong>
                                                            <span style="font-size: 17px; color: #facc15; font-weight: bold;">%s</span>
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>

                                            <!-- Alerta sobre Prazos -->
                                            <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background-color: rgba(250, 204, 21, 0.1); border-left: 4px solid #facc15; border-radius: 4px;">
                                                <tr>
                                                    <td style="padding: 14px 18px;">
                                                        <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #fef08a;">
                                                            <strong style="color: #facc15;">Atenção ao prazo:</strong> Lembre-se de devolver o exemplar até a data limite informada acima para evitar bloqueios ou penalidades em novos empréstimos.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Rodapé -->
                                    <tr>
                                        <td style="background-color: #09090b; padding: 20px 32px; text-align: center; border-top: 1px solid #27272a;">
                                            <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: bold; color: #e4e4e7;">
                                                Libee
                                            </p>
                                            <p style="margin: 0; font-size: 12px; color: #71717a;">
                                                Este é um e-mail automático de confirmação. Por favor, não responda a esta mensagem.
                                            </p>
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(urlLogo, nomeSeguro, livroSeguro, dataFormatada);
    }
}