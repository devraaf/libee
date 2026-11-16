package br.edu.fatec.libee.backend.dto.response;

import java.time.LocalDate;
import java.util.List;

public record UpcomingReturnResponse(
        Integer id,
        Integer bookId,
        String title,
        List<String> authors,
        Integer publicationYear,
        String coverImageUrl,
        LocalDate dueDate
) {
}
