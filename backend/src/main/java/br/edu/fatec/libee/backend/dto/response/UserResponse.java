package br.edu.fatec.libee.backend.dto.response;

import br.edu.fatec.libee.backend.entity.User;
import br.edu.fatec.libee.backend.enums.UserProfile;

public record UserResponse(Integer id, String name, String email, UserProfile profile) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getProfile());
    }
}
