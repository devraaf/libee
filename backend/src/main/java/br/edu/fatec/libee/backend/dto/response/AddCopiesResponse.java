package br.edu.fatec.libee.backend.dto.response;

import java.util.List;

public record AddCopiesResponse(
        BookDetailsResponse book, List<CopyConflictResponse> conflicts
) {
}
