package br.edu.fatec.libee.backend.dto.response;

public record ReaderSummaryResponse(
        long totalReaders,
        long readersWithActiveLoans,
        long readersWithOverdueLoans
) {
}
