package br.edu.fatec.libee.backend.dto.response;

public record BookCopyCount(
        Integer bookId,
        long total,
        long available
) {}
