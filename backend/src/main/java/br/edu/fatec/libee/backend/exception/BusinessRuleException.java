package br.edu.fatec.libee.backend.exception;

/** Operação viola uma regra de negócio (vira 422) */
public class BusinessRuleException extends RuntimeException {
    public BusinessRuleException(String message) {
        super(message);
    }
}
