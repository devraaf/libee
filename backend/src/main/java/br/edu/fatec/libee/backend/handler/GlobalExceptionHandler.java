package br.edu.fatec.libee.backend.handler;

import br.edu.fatec.libee.backend.exception.*;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.TypeMismatchException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;


import java.sql.SQLException;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
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

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException exception, HttpHeaders headers, HttpStatusCode status, WebRequest request){
        List<ValidationError> errors = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> new ValidationError(error.getField(), error.getDefaultMessage()))
                .sorted(Comparator.comparing(ValidationError::field)
                        .thenComparing(ValidationError::message, Comparator.nullsFirst(Comparator.naturalOrder())))
                .toList();

        ProblemDetail problem = buildProblem(HttpStatus.BAD_REQUEST, "Dados inválidos",
                "Um ou mais campos são inválidos.");
        problem.setProperty("errors", errors);

        return ResponseEntity.badRequest().body(problem);
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            HttpMessageNotReadableException exception, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail problem = buildProblem(HttpStatus.BAD_REQUEST, "Dados inválidos",
                "O corpo da requisição está ausente ou mal formatado.");
        return ResponseEntity.badRequest().body(problem);
    }

    @ExceptionHandler(AccessionNumberAlreadyRegisteredException.class)
    public ProblemDetail handleAccessionNumberAlreadyRegistered(AccessionNumberAlreadyRegisteredException exception) {
        ProblemDetail problem = buildProblem(HttpStatus.CONFLICT, "Tombo já cadastrado", exception.getMessage());
        problem.setProperty("accessionNumbers", exception.getAccessionNumbers());
        return problem;
    }

    @ExceptionHandler(DeletionBlockedException.class)
    public ProblemDetail handleDeletionBlocked(DeletionBlockedException exception) {
        ProblemDetail problem = buildProblem(HttpStatus.CONFLICT, "Exclusão não permitida", exception.getMessage());
        problem.setProperty("accessionNumbers", exception.getAccessionNumbers());
        return problem;
    }

    @ExceptionHandler(CopyAlreadyOnLoanException.class)
    public ProblemDetail handleCopyAlreadyOnLoan(CopyAlreadyOnLoanException exception) {
        ProblemDetail problem = buildProblem(HttpStatus.CONFLICT, "Exemplar já emprestado", exception.getMessage());
        problem.setProperty("accessionNumber", exception.getAccessionNumber());
        return problem;
    }

    @Override
    protected ResponseEntity<Object> handleTypeMismatch(
            TypeMismatchException exception, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        String field = exception instanceof MethodArgumentTypeMismatchException m
                ? m.getName() : exception.getPropertyName();
        ProblemDetail problem = buildProblem(HttpStatus.BAD_REQUEST, "Dados inválidos",
                "O valor informado para o parâmetro '" + field + "' é inválido.");
        return ResponseEntity.badRequest().body(problem);
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

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrityViolation(DataIntegrityViolationException exception) {
        if (exception.getMostSpecificCause() instanceof SQLException sql
                && "23505".equals(sql.getSQLState())) {
            log.warn("Violação de unicidade: {}", sql.getMessage());
            return buildProblem(HttpStatus.CONFLICT, "Conflito de dados",
                    "Algum dado enviado já está cadastrado. Revise e tente novamente.");
        }
        return handleUnexpected(exception);
    }

    private ProblemDetail buildProblem(HttpStatus status, String title, String detail) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(title);
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }
}
