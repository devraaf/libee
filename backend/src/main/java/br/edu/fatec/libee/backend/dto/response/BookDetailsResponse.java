package br.edu.fatec.libee.backend.dto.response;

import java.util.List;

public record BookDetailsResponse(
        Integer id,
        String title,
        List<AuthorResponse> authors,
        String category,
        String isbn,
        String coverImageUrl,
        String publisher,
        String publicationPlace,
        String edition,
        Integer publicationYear,
        Integer pageCount,
        String summary,
        List<CopyResponse> copies,
        long totalCopies
) {
}
