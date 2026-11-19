package br.edu.fatec.libee.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record UpdateBookRequest(
        String title,
        String isbn,
        @NotNull Integer categoryId,
        List<String> authors,
        String publisher,
        String place,
        String edition,
        String coverUrl,
        Integer publicationYear,
        Integer pageCount,
        String description,
        @Valid List<UpdateCopyRequest> copies
) {
    public record UpdateCopyRequest(
            @NotNull Integer id,
            String physicalLocation
    ) {}
}