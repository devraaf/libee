package br.edu.fatec.libee.backend.handler;

import br.edu.fatec.libee.backend.controller.ErrorTriggerController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ErrorTriggerController.class)
@WithMockUser
public class GlobalExceptionHandlerTest {

    @Autowired MockMvc mockMvc;

    @Test
    @DisplayName("Retorna 500 genérico, sem vazar detalhes, quando ocorre erro inesperado")
    void returnsGenericInternalError_whenUnexpectedExceptionOccurs() throws Exception {
        mockMvc.perform(get("/test-errors/unexpected"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.title").value("Erro interno do servidor"))
                .andExpect(jsonPath("$.traceId").exists())
                .andExpect(content().string(not(containsString("detalhe interno secreto"))));
    }

    @Test
    @DisplayName("Retorna 404 com a mensagem da exceção quando o recurso não existe")
    void returnsNotFound_whenResourceNotFoundExceptionIsThrown() throws Exception {
        mockMvc.perform(get("/test-errors/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Livro não encontrado: id 99"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @DisplayName("Retorna 422 quando uma regra de negócio é violada")
    void returnsUnprocessableContent_whenBusinessRuleExceptionIsThrown() throws Exception {
        mockMvc.perform(get("/test-errors/business-rule"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.detail").value("O exemplar já está emprestado."));
    }

    @Test
    @DisplayName("Retorna 400 em formato ProblemDetail quando um parâmetro viola a validação")
    void returnsBadRequest_whenParameterViolatesValidation() throws Exception {
        mockMvc.perform(get("/test-errors/validated").param("size", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @DisplayName("Retorna 400 quando o parâmetro não é do tipo esperado")
    void returnsBadRequest_whenParameterHasWrongType() throws Exception {
        mockMvc.perform(get("/test-errors/validated").param("size", "abc"))
                .andExpect(status().isBadRequest());
    }


    @Test
    @DisplayName("Retorna 404 em formato ProblemDetail quando a rota não existe")
    void returnsNotFound_whenRouteDoesNotExist() throws Exception {
        mockMvc.perform(get("/rota-que-nao-existe"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @DisplayName("Retorna 405 em formato ProblemDetail quando o método HTTP não é suportado")
    void returnsMethodNotAllowed_whenHttpMethodIsNotSupported() throws Exception {
        mockMvc.perform(post("/test-errors/not-found").with(csrf()))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.timestamp").exists());
    }
}