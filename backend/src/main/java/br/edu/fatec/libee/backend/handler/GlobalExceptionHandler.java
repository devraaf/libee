package br.edu.fatec.libee.backend.handler;

import br.edu.fatec.libee.backend.exception.*;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;


import java.time.Instant;
import java.util.UUID;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    // Erros de negócio
    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException exception) {
        return buildProblem(HttpStatus.NOT_FOUND, "Recurso não encontrado", exception.getMessage());
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ProblemDetail handleBusinessRule(BusinessRuleException exception) {
        return buildProblem(HttpStatus.UNPROCESSABLE_CONTENT, "Regra de negócio violada", exception.getMessage());
    }

    @ExceptionHandler(InvalidIsbnException.class)
    public ProblemDetail handleInvalidIsbn(InvalidIsbnException exception){
        return buildProblem(HttpStatus.BAD_REQUEST, "ISBN inválido", exception.getMessage());
    }

    @ExceptionHandler(BookAlreadyRegisteredException.class)
    public ProblemDetail handleBookAlreadyRegister(BookAlreadyRegisteredException exception){
        ProblemDetail problem = buildProblem(HttpStatus.CONFLICT, "Livro já cadastrado", exception.getMessage());
        problem.setProperty("bookId", exception.getBookId());
        return problem;
    }

    @ExceptionHandler(ExternalServiceException.class)
    public ProblemDetail handleExternalService(ExternalServiceException exception){
        return buildProblem(HttpStatus.SERVICE_UNAVAILABLE, "Serviço indisponível", exception.getMessage());
    }

    // Segurança
    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException exception) {
        return buildProblem(HttpStatus.FORBIDDEN, "Acesso negado",
                "Você não tem permissão para acessar este recurso.");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleAuthentication(AuthenticationException exception) {
        return buildProblem(HttpStatus.UNAUTHORIZED, "Não autenticado",
                "Autenticação necessária ou inválida.");
    }

    // Qualquer outro erro: 500 genérico, detalhe só no log
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception exception) {
        String traceId = UUID.randomUUID().toString();
        log.error("Erro interno inesperado [Trace ID: {}]", traceId, exception);

        ProblemDetail problem = buildProblem(HttpStatus.INTERNAL_SERVER_ERROR,
                "Erro interno do servidor",
                "Ocorreu um erro interno inesperado no sistema. Tente novamente mais tarde.");
        problem.setProperty("traceId", traceId);
        return problem;
    }

    // Erros tratados pela classe-base (400, 404 de rota, 405...): mesmo formato

    @Override
    protected @Nullable ResponseEntity<Object> handleExceptionInternal(
            Exception exception, @Nullable Object body, HttpHeaders headers,
            HttpStatusCode statusCode, WebRequest request) {

        ResponseEntity<Object> response =
                super.handleExceptionInternal(exception, body, headers, statusCode, request);

        if (response != null && response.getBody() instanceof ProblemDetail problem) {
            problem.setProperty("timestamp", Instant.now());
        }
        return response;
    }

    private ProblemDetail buildProblem(HttpStatus status, String title, String detail) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(title);
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }
}
