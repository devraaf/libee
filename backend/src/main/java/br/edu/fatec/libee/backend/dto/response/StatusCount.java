package br.edu.fatec.libee.backend.dto.response;

import br.edu.fatec.libee.backend.enums.CopyStatus;

public record StatusCount(CopyStatus status, long total ) {}
