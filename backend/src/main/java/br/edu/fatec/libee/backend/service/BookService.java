package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.dto.response.*;
import br.edu.fatec.libee.backend.dto.response.BookCopyCount;
import br.edu.fatec.libee.backend.dto.response.BookListItemResponse;
import br.edu.fatec.libee.backend.dto.response.BookManagementItemResponse;
import br.edu.fatec.libee.backend.entity.Author;
import br.edu.fatec.libee.backend.entity.Book;
import br.edu.fatec.libee.backend.entity.Copy;
import br.edu.fatec.libee.backend.enums.CopyStatus;
import br.edu.fatec.libee.backend.exception.ResourceNotFoundException;
import br.edu.fatec.libee.backend.repository.BookRepository;
import br.edu.fatec.libee.backend.repository.CopyRepository;
import br.edu.fatec.libee.backend.specification.BookSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class BookService {
    private final BookRepository bookRepository;
    private final CopyRepository copyRepository;

    private Page<Book> searchBooks(String q, Integer categoryId, int page, int size){
        Pageable pageable = PageRequest.of(page, size, Sort.by("title").and(Sort.by("id")));
         return bookRepository.findAll(BookSpecification.search(q, categoryId), pageable);
    }

    @Transactional(readOnly = true)
    public PageResponse<BookListItemResponse> list(String q, Integer categoryId, int page, int size){
        Page<Book> books = searchBooks(q, categoryId, page, size);

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
    public BookDetailsResponse getBookById(Integer id) {
        Book b = bookRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Livro não encontrado com o ID informado."));
        List<Copy> copies = copyRepository.findByBookIdOrderByAccessionNumberAsc(id);
        List<CopyResponse> copyResponses = copies.stream().map(c-> new CopyResponse(
                c.getAccessionNumber(),
                c.getPhysicalLocation(),
                c.getStatus()
                )).toList();

        return new BookDetailsResponse(
                b.getId(),
                b.getTitle(),
                b.getAuthors().stream().map(Author::getName).sorted().map(AuthorResponse::new).toList(),
                b.getCategory().getName(),
                b.getIsbn(),
                b.getCoverImageUrl(),
                b.getPublisher(),
                b.getPublicationPlace(),
                b.getEdition(),
                b.getPublicationDate() != null ? b.getPublicationDate().getYear() : null,
                b.getPageCount(),
                b.getSummary(),
                copyResponses,
                copyResponses.size()
        );
    }
    public PageResponse<BookManagementItemResponse> listForManagement(String q, Integer categoryId, int page, int size){
        Page<Book> books = searchBooks(q, categoryId, page, size);

        Map<Integer, BookCopyCount> counts = books.isEmpty() ? Map.of() : copyRepository.countCopiesByBookIds(
                        books.stream().map(Book::getId).toList(), CopyStatus.AVAILABLE)
                .stream()
                .collect(Collectors.toMap(BookCopyCount::bookId, Function.identity()));

        return PageResponse.from(books.map(b -> {
            BookCopyCount count = counts.getOrDefault(b.getId(), new BookCopyCount(b.getId(), 0L, 0L));
            return new BookManagementItemResponse(
                    b.getId(),
                    b.getTitle(),
                    b.getAuthors().stream().map(Author::getName).sorted().toList(),
                    b.getIsbn(),
                    b.getCategory().getName(),
                    b.getCoverImageUrl(),
                    count.total(),
                    count.available());
        }));
    }

}
