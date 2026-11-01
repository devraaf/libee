package br.edu.fatec.libee.backend.dto.response;

import br.edu.fatec.libee.backend.enums.LoanStatus;

import java.time.LocalDate;
import java.util.List;

public record ReaderLoanResponse(
        Integer id,
        BookSummary book,
        String accessionNumber,
        LocalDate loanDate,
        LocalDate dueDate,
        LocalDate returnDate,   // null enquanto não devolvido
        int renewalCount,
        LoanStatus status
) {
    public record BookSummary(
            Integer id,
            String title,
            List<String> authors,
            String coverImageUrl
    ) {}
}
