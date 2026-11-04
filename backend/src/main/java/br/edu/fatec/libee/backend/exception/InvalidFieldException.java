package br.edu.fatec.libee.backend.exception;

import lombok.Getter;

@Getter
public class InvalidFieldException extends RuntimeException {
    private final String field;
    public InvalidFieldException(String field, String message) {
        super(message);
        this.field = field;
    }
}
