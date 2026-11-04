package br.edu.fatec.libee.backend.exception;

import lombok.Getter;

@Getter
public class CopyAlreadyOnLoanException extends RuntimeException {
    private final String accessionNumber;

    public CopyAlreadyOnLoanException(String accessionNumber) {
        super("O exemplar de tombo " + accessionNumber + " já está emprestado.");
        this.accessionNumber = accessionNumber;
    }
}
