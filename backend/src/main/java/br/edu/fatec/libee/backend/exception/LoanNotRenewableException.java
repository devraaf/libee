package br.edu.fatec.libee.backend.exception;

public class LoanNotRenewableException extends RuntimeException {
    public LoanNotRenewableException(String message) {
        super(message);
    }
}
