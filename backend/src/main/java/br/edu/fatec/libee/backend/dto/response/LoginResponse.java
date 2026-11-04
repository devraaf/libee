package br.edu.fatec.libee.backend.dto.response;

import br.edu.fatec.libee.backend.enums.UserProfile;

public record LoginResponse(String token, Integer id, UserProfile profile) {
}
