package br.edu.fatec.libee.backend.client.book;

import java.util.List;

public record BookMetadata(
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
}
