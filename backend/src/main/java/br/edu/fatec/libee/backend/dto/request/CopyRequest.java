package br.edu.fatec.libee.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CopyRequest(

        @NotBlank(message = "O tombo é obrigatório.")
        @Size(max = 30, message = "O tombo deve ter no máximo 30 caracteres.")
        String accessionNumber,

        @NotBlank(message = "A localização física é obrigatória.")
        @Size(max = 100, message = "A localização deve ter no máximo 100 caracteres.")
        String physicalLocation
) {
}