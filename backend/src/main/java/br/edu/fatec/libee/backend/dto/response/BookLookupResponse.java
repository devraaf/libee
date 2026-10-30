package br.edu.fatec.libee.backend.dto.response;

import br.edu.fatec.libee.backend.client.book.BookMetadata;

import java.util.List;

public record BookLookupResponse(
        String title,
        List<String> authors,
        String publisher,
        Integer publicationYear,
        Integer pageCount,
        List<String> categorySuggestions,
        String place,
        String edition,
        String description,
        String coverUrl
) {
    public static BookLookupResponse from(BookMetadata metadata) {
        return new BookLookupResponse(
                metadata.title(),
                metadata.authors(),
                metadata.publisher(),
                metadata.publicationYear(),
                metadata.pageCount(),
                metadata.categorySuggestions(),
                metadata.place(),
                metadata.edition(),
                metadata.description(),
                metadata.coverUrl()
        );
    }
}
