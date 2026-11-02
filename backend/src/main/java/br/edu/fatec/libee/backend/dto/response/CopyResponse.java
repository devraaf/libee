package br.edu.fatec.libee.backend.dto.response;

import br.edu.fatec.libee.backend.enums.CopyStatus;

public record CopyResponse(
        Integer copyId,
        String accessionNumber,
        String physicalLocation,
        CopyStatus status) {
}
