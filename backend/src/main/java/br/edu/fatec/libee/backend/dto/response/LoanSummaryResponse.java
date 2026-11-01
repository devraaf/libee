package br.edu.fatec.libee.backend.dto.response;

public record LoanSummaryResponse(
        long activeLoans,
        long onTimeLoans,
        long overdueLoans
) {
}
