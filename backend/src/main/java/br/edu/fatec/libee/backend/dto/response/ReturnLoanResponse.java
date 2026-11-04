package br.edu.fatec.libee.backend.dto.response;

import java.time.LocalDate;

public record ReturnLoanResponse(
        Integer id,
        String readerName,
        String title,
        String accessionNumber,
        LocalDate returnDate
) {
}
