package br.edu.fatec.libee.backend.dto.response;

import br.edu.fatec.libee.backend.enums.CopyStatus;

public record CopyResponse(String accessionNumber, String physicalLocation, CopyStatus status) {
}
