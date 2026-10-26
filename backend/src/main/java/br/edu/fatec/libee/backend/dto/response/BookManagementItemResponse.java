package br.edu.fatec.libee.backend.dto.response;

import java.util.List;

public record BookManagementItemResponse(
        Integer id,
        String title,
        List<String> authors,
        String isbn,
        String category,
        String coverImageUrl,
        long totalCopies,
        long availableCopies
) {}
