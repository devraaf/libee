package br.edu.fatec.libee.backend.dto.response;

import br.edu.fatec.libee.backend.enums.LoanStatus;

import java.time.LocalDate;

public record ActiveLoanResponse(
        Integer id,
        String readerName,
        String title,
        String accessionNumber,
        LocalDate loanDate,
        LocalDate dueDate,
        int renewalCount,
        LoanStatus status
) {
}
