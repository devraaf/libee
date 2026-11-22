package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.dto.request.AddCopiesRequest;
import br.edu.fatec.libee.backend.dto.request.CopyRequest;
import br.edu.fatec.libee.backend.dto.request.RegisterBookRequest;
import br.edu.fatec.libee.backend.dto.response.*;
import br.edu.fatec.libee.backend.entity.Author;
import br.edu.fatec.libee.backend.entity.Book;
import br.edu.fatec.libee.backend.entity.Category;
import br.edu.fatec.libee.backend.entity.Copy;
import br.edu.fatec.libee.backend.enums.CopyStatus;
import br.edu.fatec.libee.backend.exception.*;
import br.edu.fatec.libee.backend.repository.*;
import br.edu.fatec.libee.backend.specification.BookSpecification;
import br.edu.fatec.libee.backend.util.IsbnNormalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class BookService {
    private final BookRepository bookRepository;
    private final CopyRepository copyRepository;
    private final CategoryRepository categoryRepository;
    private final AuthorRepository authorRepository;

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
        Book b = bookRepository.findByIdAndDeletedAtIsNull(id).orElseThrow(() -> new ResourceNotFoundException("Livro não encontrado com o ID informado."));
        List<Copy> copies = copyRepository.findByBookIdAndDeletedAtIsNullOrderByAccessionNumberAsc(id);
        List<CopyResponse> copyResponses = copies.stream().map(c-> new CopyResponse(
                c.getId(),
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
                bookRepository.countByDeletedAtIsNull(), totalCopies, available, onLoan
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
        bookRepository.findByIsbnAndDeletedAtIsNull(isbn).ifPresent(existing -> {
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
    public List<CopyConflictResponse> createCopies(Integer bookId, AddCopiesRequest request) {
        Book book = bookRepository.findByIdAndDeletedAtIsNull(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Livro não encontrado."));

        List<CopyConflictResponse> conflicts = new ArrayList<>();

        // Tombos informados; se um tombo se repete, vale a primeira ocorrência
        Map<String, CopyRequest> requested = new LinkedHashMap<>();
        for (CopyRequest copyRequest : request.copies()) {
            String accessionNumber = copyRequest.accessionNumber().trim();
            if (requested.putIfAbsent(accessionNumber, copyRequest) != null) {
                conflicts.add(new CopyConflictResponse(accessionNumber,
                        "Tombo repetido na requisição; só a primeira ocorrência foi considerada."));
            }
        }

        // Exemplares que já existem no banco (ativos ou excluídos), por tombo
        Map<String, Copy> existingByAccessionNumber = copyRepository
                .findByAccessionNumberIn(requested.keySet()).stream()
                .collect(Collectors.toMap(Copy::getAccessionNumber, Function.identity()));

        List<Copy> newCopies = new ArrayList<>();
        int reactivatedCount = 0;

        for (Map.Entry<String, CopyRequest> entry : requested.entrySet()) {
            String accessionNumber = entry.getKey();
            String physicalLocation = entry.getValue().physicalLocation().trim();
            Copy existingCopy = existingByAccessionNumber.get(accessionNumber);

            if (existingCopy == null) {
                Copy copy = new Copy();
                copy.setBook(book);
                copy.setAccessionNumber(accessionNumber);
                copy.setPhysicalLocation(physicalLocation);
                copy.setStatus(CopyStatus.AVAILABLE);
                newCopies.add(copy);
            } else if (canReactivate(existingCopy, bookId)) {
                // Reativação
                existingCopy.setDeletedAt(null);
                existingCopy.setPhysicalLocation(physicalLocation);
                existingCopy.setStatus(CopyStatus.AVAILABLE);
                reactivatedCount++;
            } else {
                String reason = existingCopy.getDeletedAt() == null
                        ? "Tombo já cadastrado."
                        : "Tombo pertence a outro livro.";
                conflicts.add(new CopyConflictResponse(accessionNumber, reason));
            }
        }

        // Nada foi gravado nem alterado: a requisição inteira falhou por conflito
        if (newCopies.isEmpty() && reactivatedCount == 0) {
            throw new AccessionNumberAlreadyRegisteredException(
                    conflicts.stream().map(CopyConflictResponse::accessionNumber).distinct().toList());
        }

        copyRepository.saveAllAndFlush(newCopies);
        return conflicts;
    }

    // Só pode ser reativado o exemplar excluído que pertence a este livro
    private static boolean canReactivate(Copy copy, Integer bookId) {
        return copy.getDeletedAt() != null && copy.getBook().getId().equals(bookId);
    }

    @Transactional
    public void deleteBook(Integer bookId) {
        Book book = bookRepository.findByIdAndDeletedAtIsNull(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Livro não encontrado."));

        List<String> onLoan = copyRepository.findAccessionNumbersByBookIdAndStatus(bookId, CopyStatus.ON_LOAN);
        if (!onLoan.isEmpty()) {
            throw DeletionBlockedException.forBook(onLoan);
        }

        Instant now = Instant.now();
        book.setDeletedAt(now);
        copyRepository.softDeleteByBookId(bookId, now);
    }

    @Transactional
    public void deleteCopy(Integer bookId, Integer copyId) {
        Copy copy = copyRepository.findByIdAndBookIdAndDeletedAtIsNull(copyId, bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Exemplar não encontrado."));

        if (copy.getStatus() == CopyStatus.ON_LOAN) {
            throw DeletionBlockedException.forCopy(copy.getAccessionNumber());
        }

        Instant now = Instant.now();
        boolean isLastActiveCopy = copyRepository.countByBookIdAndDeletedAtIsNull(bookId) == 1;

        copy.setDeletedAt(now);
        if (isLastActiveCopy) {
            copy.getBook().setDeletedAt(now);
        }
    }
}
