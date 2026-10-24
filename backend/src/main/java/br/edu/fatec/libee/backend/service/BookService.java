package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.dto.response.BookListItemResponse;
import br.edu.fatec.libee.backend.dto.response.BookManagementSummaryResponse;
import br.edu.fatec.libee.backend.dto.response.StatusCount;
import br.edu.fatec.libee.backend.entity.Author;
import br.edu.fatec.libee.backend.entity.Book;
import br.edu.fatec.libee.backend.enums.CopyStatus;
import br.edu.fatec.libee.backend.repository.BookRepository;
import br.edu.fatec.libee.backend.repository.CopyRepository;
import br.edu.fatec.libee.backend.specification.BookSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import br.edu.fatec.libee.backend.dto.response.PageResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class BookService {
    private final BookRepository bookRepository;
    private final CopyRepository copyRepository;

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

    @Transactional(readOnly = true)
    public BookManagementSummaryResponse getManagementSummary(){
        Map<CopyStatus, Long> byStatus = copyRepository.countByStatus()
                .stream()
                .collect(Collectors.toMap(StatusCount::status, StatusCount::total));
        long available = byStatus.getOrDefault(CopyStatus.AVAILABLE, 0L);
        long onLoan = byStatus.getOrDefault(CopyStatus.ON_LOAN, 0L);
        long totalCopies = byStatus.values().stream().mapToLong(Long::longValue).sum();

        return new BookManagementSummaryResponse(
                bookRepository.count(), totalCopies, available, onLoan
        );
    }
}
