package br.edu.fatec.libee.backend.exception;

import lombok.Getter;

import java.util.List;

@Getter
public class AccessionNumberAlreadyRegisteredException extends RuntimeException {
    private final List<String> accessionNumbers;

    public AccessionNumberAlreadyRegisteredException(List<String> accessionNumbers) {
        super("Já existe exemplar cadastrado com o(s) tombo(s): " + String.join(", ", accessionNumbers));
        this.accessionNumbers = accessionNumbers;
    }

}
