package br.edu.fatec.libee.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record AddCopiesRequest(
        @NotEmpty(message = "Informe ao menos um exemplar.")
        @Valid
        List<CopyRequest> copies
) {}
