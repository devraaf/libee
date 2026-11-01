package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.dto.request.RegisterBookRequest;
import br.edu.fatec.libee.backend.dto.response.*;
import br.edu.fatec.libee.backend.entity.Author;
import br.edu.fatec.libee.backend.entity.Book;
import br.edu.fatec.libee.backend.entity.Category;
import br.edu.fatec.libee.backend.entity.Copy;
import br.edu.fatec.libee.backend.enums.CopyStatus;
import br.edu.fatec.libee.backend.exception.AccessionNumberAlreadyRegisteredException;
import br.edu.fatec.libee.backend.exception.BookAlreadyRegisteredException;
import br.edu.fatec.libee.backend.exception.BusinessRuleException;
import br.edu.fatec.libee.backend.exception.ConflictException;
import br.edu.fatec.libee.backend.exception.ResourceNotFoundException;
import br.edu.fatec.libee.backend.repository.AuthorRepository;
import br.edu.fatec.libee.backend.repository.BookRepository;
import br.edu.fatec.libee.backend.repository.CategoryRepository;
import br.edu.fatec.libee.backend.repository.CopyRepository;
import br.edu.fatec.libee.backend.repository.LoanRepository;
import br.edu.fatec.libee.backend.specification.BookSpecification;
import br.edu.fatec.libee.backend.util.IsbnNormalizer;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.time.Instant;
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
    private final CategoryRepository categoryRepository;
    private final AuthorRepository authorRepository;
    private final LoanRepository loanRepository;

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
                b.getPublicationYear(),
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
                b.getPublicationYear(),
                b.getPageCount(),
                b.getSummary(),
                copyResponses,
                copyResponses.size()
        );
    }

    @Transactional(readOnly = true)
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

    @Transactional
    public Integer register(RegisterBookRequest request) {
        if (request.copies().isEmpty()) {
            throw new BusinessRuleException("Informe ao menos um exemplar.");
        }
        String isbn = IsbnNormalizer.normalize(request.isbn());
        checkIsbnIsAvailable(isbn);

        List<String> accessionNumbers = request.copies().stream()
                .map(copy -> copy.accessionNumber().trim())
                .toList();
        checkAccessionNumbersAreAvailable(accessionNumbers);

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new BusinessRuleException("Categoria não encontrada."));

        List<Author> authors = resolveAuthors(request.authors());

        Book book = new Book();
        book.setTitle(request.title().trim());
        book.setIsbn(isbn);
        book.setCategory(category);
        book.setAuthors(new LinkedHashSet<>(authors));
        book.setCoverImageUrl(clean(request.coverUrl()));
        book.setPublisher(clean(request.publisher()));
        book.setPublicationPlace(clean(request.place()));
        book.setEdition(clean(request.edition()));
        book.setPublicationYear(request.publicationYear());
        book.setPageCount(request.pageCount());
        book.setSummary(clean(request.description()));

        Book saved = bookRepository.saveAndFlush(book);

        List<Copy> copies = request.copies().stream()
                .map(copyRequest -> {
                    Copy copy = new Copy();
                    copy.setBook(saved);
                    copy.setAccessionNumber(copyRequest.accessionNumber().trim());
                    copy.setPhysicalLocation(copyRequest.physicalLocation().trim());
                    copy.setStatus(CopyStatus.AVAILABLE);
                    return copy;
                })
                .toList();
        copyRepository.saveAllAndFlush(copies);

        return saved.getId();
    }

    private void checkIsbnIsAvailable(String isbn) {
        bookRepository.findByIsbn(isbn).ifPresent(existing -> {
            throw new BookAlreadyRegisteredException(existing.getId());
        });
    }

    private void checkAccessionNumbersAreAvailable(List<String> accessionNumbers) {
        Set<String> conflicts = new LinkedHashSet<>();

        // Tombos repetidos dentro da própria requisição
        Set<String> seen = new HashSet<>();
        for (String accessionNumber : accessionNumbers) {
            if (!seen.add(accessionNumber)) {
                conflicts.add(accessionNumber);
            }
        }
        // Tombos que já existem no banco
        conflicts.addAll(copyRepository.findExistingAccessionNumbers(accessionNumbers));
        if (!conflicts.isEmpty()) {
            throw new AccessionNumberAlreadyRegisteredException(new ArrayList<>(conflicts));
        }
    }

    private List<Author> resolveAuthors(List<String> rawNames) {
        if (rawNames.isEmpty()) {
            return List.of();
        }
        // nome em minúsculas -> nome limpo; descarta repetidos e mantém a ordem recebida
        Map<String, String> namesByLowerCase = new LinkedHashMap<>();
        for (String raw : rawNames) {
            String name = raw.trim().replaceAll("\\s+", " ");
            namesByLowerCase.putIfAbsent(name.toLowerCase(Locale.ROOT), name);
        }

        Map<String, Author> existing = authorRepository
                .findByLowerNameIn(namesByLowerCase.keySet()).stream()
                .collect(Collectors.toMap(
                        author -> author.getName().toLowerCase(Locale.ROOT),
                        Function.identity(),
                        (first, second) -> first));   // se o banco já tiver nomes duplicados, usa o primeiro

        List<Author> result = new ArrayList<>();
        List<Author> toCreate = new ArrayList<>();
        namesByLowerCase.forEach((lowerCase, name) -> {
            Author author = existing.get(lowerCase);
            if (author == null) {
                author = new Author();
                author.setName(name);
                toCreate.add(author);
            }
            result.add(author);
        });

        authorRepository.saveAll(toCreate);
        return result;
    }

    // Texto opcional em branco vira null
    private static String clean(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    @Transactional
    public void deleteBook(Integer bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Livro não encontrado"));

        if (loanRepository.existsByCopyBookIdAndReturnDateIsNull(bookId)) {
            throw new ConflictException(
                    "Não é possível excluir o livro: há exemplares em empréstimo. Aguarde as devoluções.");
        }
        Instant now = Instant.now();
        copyRepository.softDeleteByBookId(bookId, now);
        book.setDeletedAt(now);
    }

    public void deleteCopy(Integer copyId) {
        Copy copy = copyRepository.findById(copyId)
                .orElseThrow(() -> new ResourceNotFoundException("Exemplar não encontrado"));

        if (loanRepository.existsByCopyIdAndReturnDateIsNull(copyId)) {
            throw new ConflictException(
                    "Não é possível excluir o exemplar: ele está em empréstimo. Aguarde a devolução.");
        }
        copy.setDeletedAt(Instant.now());
    }
}
