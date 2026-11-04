package br.edu.fatec.libee.backend.dto.response;

import java.util.List;

public record BookListItemResponse(
        Integer id,
        String title,
        List<String> authors,
        Integer publicationYear,
        String category,
        String coverImageUrl,
        boolean available
) {}
