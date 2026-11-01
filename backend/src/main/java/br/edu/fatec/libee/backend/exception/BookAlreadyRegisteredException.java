package br.edu.fatec.libee.backend.exception;

import lombok.Getter;

@Getter
public class BookAlreadyRegisteredException extends RuntimeException {

    private final Integer bookId;

    public BookAlreadyRegisteredException(Integer bookId) {

        super("Já existe um livro cadastrado com esse ISBN.");
        this.bookId = bookId;
    }

}
