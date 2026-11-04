package br.edu.fatec.libee.backend.exception;

import lombok.Getter;

@Getter
public class CopyNotOnLoanException extends RuntimeException {
    private final String accessionNumber;

    public CopyNotOnLoanException(String accessionNumber) {
        super("O exemplar de tombo " + accessionNumber + " não possui empréstimo ativo.");
        this.accessionNumber = accessionNumber;
    }
}
