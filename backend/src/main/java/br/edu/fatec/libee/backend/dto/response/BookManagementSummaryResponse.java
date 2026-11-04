package br.edu.fatec.libee.backend.dto.response;

public record BookManagementSummaryResponse(
        long totalBooks,
        long totalCopies,
        long availableCopies,
        long onLoanCopies
) {}
