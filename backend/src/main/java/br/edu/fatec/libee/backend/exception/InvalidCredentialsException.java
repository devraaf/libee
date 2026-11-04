package br.edu.fatec.libee.backend.exception;

public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException() {
        super("E-mail ou senha incorretos.");
    }
}
