package br.edu.fatec.libee.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RegisterReturnRequest(
        @NotBlank(message = "Informe o tombo do exemplar.")
        String accessionNumber
) {
}
