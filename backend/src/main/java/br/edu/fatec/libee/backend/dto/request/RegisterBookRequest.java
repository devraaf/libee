package br.edu.fatec.libee.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

public record RegisterBookRequest(

        @NotBlank(message = "O título é obrigatório.")
        @Size(max = 255, message = "O título deve ter no máximo 255 caracteres.")
        String title,

        List<@NotBlank(message = "O nome do autor não pode ser vazio.")
        @Size(max = 255, message = "O nome do autor deve ter no máximo 255 caracteres.") String> authors,

        @NotNull(message = "A categoria é obrigatória.")
        @Positive(message = "Categoria inválida.")
        Integer categoryId,

        @NotBlank(message = "O ISBN é obrigatório.")
        @Pattern(regexp = "^(\\d{9}[\\dXx]|\\d{13})$",
                message = "ISBN inválido. Informe 10 ou 13 caracteres, sem hífens.")
        String isbn,

        @Size(max = 500, message = "A URL da capa deve ter no máximo 500 caracteres.")
        String coverUrl,

        @Size(max = 150, message = "A editora deve ter no máximo 150 caracteres.")
        String publisher,

        @Size(max = 100, message = "O local de publicação deve ter no máximo 100 caracteres.")
        String place,

        @Size(max = 50, message = "A edição deve ter no máximo 50 caracteres.")
        String edition,

        @Min(value = 1000, message = "Ano de publicação inválido.")
        @Max(value = 2100, message = "Ano de publicação inválido.")
        Integer publicationYear,

        @Positive(message = "O número de páginas deve ser positivo.")
        Integer pageCount,

        String description,

        @NotEmpty(message = "Informe ao menos um exemplar.")
        List<@Valid CopyRequest> copies
) {
    public RegisterBookRequest {
        authors = authors == null ? List.of() : authors;
    }
}
