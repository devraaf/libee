package br.edu.fatec.libee.backend.dto.response;

import br.edu.fatec.libee.backend.enums.AffiliationType;
import br.edu.fatec.libee.backend.enums.ReaderStatus;

public record ReaderListItemResponse(
        Integer id,
        String name,
        String email,
        String phone,
        AffiliationType affiliationType,
        String courseName,
        long activeLoans,
        ReaderStatus status) {
}