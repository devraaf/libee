package br.edu.fatec.libee.backend.dto.response;

import br.edu.fatec.libee.backend.entity.Category;

public record CategoryResponse(
        Integer id,
        String name
) {
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getName());
    }
}
