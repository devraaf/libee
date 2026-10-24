package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.dto.response.BookListItemResponse;
import br.edu.fatec.libee.backend.dto.response.CategoryResponse;
import br.edu.fatec.libee.backend.entity.Author;
import br.edu.fatec.libee.backend.entity.Book;
import br.edu.fatec.libee.backend.entity.Category;
import br.edu.fatec.libee.backend.enums.CopyStatus;
import br.edu.fatec.libee.backend.repository.BookRepository;
import br.edu.fatec.libee.backend.repository.CategoryRepository;
import br.edu.fatec.libee.backend.repository.CopyRepository;
import br.edu.fatec.libee.backend.specification.BookSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import br.edu.fatec.libee.backend.dto.response.PageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;


@Service
@RequiredArgsConstructor
public class BookService {
    private final BookRepository bookRepository;
    private final CopyRepository copyRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public PageResponse<BookListItemResponse> list(String q, Integer categoryId, int page, int size){
        Pageable pageable = PageRequest.of(page, size, Sort.by("title").and(Sort.by("id")));
        Page<Book> books = bookRepository.findAll(BookSpecification.search(q, categoryId), pageable);

        Set<Integer> availableIds = books.isEmpty()
                ? Set.of()
                : copyRepository.findBookIdsWithStatus(
                books.stream().map(Book::getId).toList(), CopyStatus.AVAILABLE);

        return PageResponse.from(books.map(b -> toItem(b, availableIds.contains(b.getId()))));
    }
    private BookListItemResponse toItem(Book b, boolean available) {
        return new BookListItemResponse(
                b.getId(),
                b.getTitle(),
                b.getAuthors().stream().map(Author::getName).sorted().toList(),
                b.getPublicationDate() != null ? b.getPublicationDate().getYear() : null,
                b.getCategory().getName(),
                b.getCoverImageUrl(),
                available);
    }
}
