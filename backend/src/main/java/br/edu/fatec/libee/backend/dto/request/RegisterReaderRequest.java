package br.edu.fatec.libee.backend.dto.request;

import br.edu.fatec.libee.backend.enums.AffiliationType;
import jakarta.validation.constraints.*;

public record RegisterReaderRequest(
        @NotBlank @Size(max = 255) String name,
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @Pattern(regexp = "^[1-9]{2}(9[0-9]{8}|[2-5][0-9]{7})$",
                message = "Telefone inválido. Informe só dígitos, com DDD.") String phone,
        @NotNull AffiliationType affiliationType,
        Integer courseId
) {
}
