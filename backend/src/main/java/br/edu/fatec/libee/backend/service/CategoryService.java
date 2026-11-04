package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.dto.request.CreateCategoryRequest;
import br.edu.fatec.libee.backend.dto.response.CategoryResponse;
import br.edu.fatec.libee.backend.entity.Category;
import br.edu.fatec.libee.backend.exception.ResourceAlreadyExistsException;
import br.edu.fatec.libee.backend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategories() {
        List<Category> categories = categoryRepository.findAll(Sort.by("name"));
        return categories.stream().map(c-> new CategoryResponse(
                c.getId(),
                c.getName()
        )).toList();
    }

    @Transactional
    public CategoryResponse create(CreateCategoryRequest request) {
        String name = request.name().trim();
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new ResourceAlreadyExistsException("Já existe uma categoria com o nome \"" + name + "\".");
        }
        Category category = new Category();
        category.setName(name);
        return CategoryResponse.from(categoryRepository.save(category));
    }
}
