package br.edu.fatec.libee.backend.exception;

/**  Recurso solicitado não existe (vira 404) */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
