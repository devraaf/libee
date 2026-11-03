package br.edu.fatec.libee.backend.dto.request;

import br.edu.fatec.libee.backend.validation.AfterToday;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record RegisterLoanRequest(
        @NotNull(message = "Informe o leitor.")
        Integer readerId,

        @NotBlank(message = "Informe o tombo do exemplar.")
        String accessionNumber,

        @NotNull(message = "Informe a data prevista de devolução.")
        @AfterToday(message = "A data prevista de devolução deve ser posterior à data atual.")
        LocalDate dueDate
) {
}
