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

        // ISBN é único no banco: livro ativo é conflito; livro excluído é reativado
        Optional<Book> existingBook = bookRepository.findByIsbn(isbn);
        if (existingBook.isPresent() && existingBook.get().getDeletedAt() == null) {
            throw new BookAlreadyRegisteredException(existingBook.get().getId());
        }

        // Com qualquer tombo em conflito, nada é gravado
        CopyAnalysis analysis = analyzeCopies(existingBook.map(Book::getId).orElse(null), request.copies());
        if (!analysis.conflicts().isEmpty()) {
            throw new AccessionNumberAlreadyRegisteredException(conflictingAccessionNumbers(analysis.conflicts()));
        }

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new BusinessRuleException("Categoria não encontrada."));

        List<Author> authors = resolveAuthors(request.authors());

        // Reativa o livro excluído, ou cria um novo; os dados do request substituem os antigos
        Book book = existingBook.orElseGet(Book::new);
        book.setDeletedAt(null);
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
        applyCopies(saved, analysis);

        return saved.getId();
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

        CopyAnalysis analysis = analyzeCopies(bookId, request.copies());
        int savedCount = applyCopies(book, analysis);

        // Nada foi gravado nem alterado: a requisição inteira falhou por conflito
        if (savedCount == 0) {
            throw new AccessionNumberAlreadyRegisteredException(conflictingAccessionNumbers(analysis.conflicts()));
        }
        return analysis.conflicts();
    }

    // Resultado da análise dos tombos de uma requisição: nada é gravado nem alterado nela
    private record CopyAnalysis(Map<String, CopyRequest> requested,
                                Map<String, Copy> existing,
                                List<CopyConflictResponse> conflicts) {
    }

    // bookId é o livro que receberá os exemplares; null quando o livro ainda não existe
    private CopyAnalysis analyzeCopies(Integer bookId, List<CopyRequest> copyRequests) {
        List<CopyConflictResponse> conflicts = new ArrayList<>();

        // Tombos informados; se um tombo se repete, vale a primeira ocorrência
        Map<String, CopyRequest> requested = new LinkedHashMap<>();
        for (CopyRequest copyRequest : copyRequests) {
            String accessionNumber = copyRequest.accessionNumber().trim();
            if (requested.putIfAbsent(accessionNumber, copyRequest) != null) {
                conflicts.add(new CopyConflictResponse(accessionNumber,
                        "Tombo repetido na requisição; só a primeira ocorrência foi considerada."));
            }
        }

        // Exemplares que já existem no banco (ativos ou excluídos), por tombo
        Map<String, Copy> existing = copyRepository.findByAccessionNumberIn(requested.keySet()).stream()
                .collect(Collectors.toMap(Copy::getAccessionNumber, Function.identity()));

        // Mantém a ordem da requisição nos conflitos
        for (String accessionNumber : requested.keySet()) {
            Copy copy = existing.get(accessionNumber);
            if (copy != null && !canReactivate(copy, bookId)) {
                String reason = copy.getDeletedAt() == null
                        ? "Tombo já cadastrado."
                        : "Tombo pertence a outro livro.";
                conflicts.add(new CopyConflictResponse(accessionNumber, reason));
            }
        }
        return new CopyAnalysis(requested, existing, conflicts);
    }

    // Cria os exemplares novos e reativa os excluídos do mesmo livro; ignora os que conflitam.
// Devolve quantos exemplares foram criados ou reativados.
    private int applyCopies(Book book, CopyAnalysis analysis) {
        List<Copy> newCopies = new ArrayList<>();
        int reactivatedCount = 0;

        for (Map.Entry<String, CopyRequest> entry : analysis.requested().entrySet()) {
            String accessionNumber = entry.getKey();
            String physicalLocation = entry.getValue().physicalLocation().trim();
            Copy existingCopy = analysis.existing().get(accessionNumber);

            if (existingCopy == null) {
                Copy copy = new Copy();
                copy.setBook(book);
                copy.setAccessionNumber(accessionNumber);
                copy.setPhysicalLocation(physicalLocation);
                copy.setStatus(CopyStatus.AVAILABLE);
                newCopies.add(copy);
            } else if (canReactivate(existingCopy, book.getId())) {
                // Reativação: o Hibernate grava a mudança no commit
                existingCopy.setDeletedAt(null);
                existingCopy.setPhysicalLocation(physicalLocation);
                existingCopy.setStatus(CopyStatus.AVAILABLE);
                reactivatedCount++;
            }
            // Qualquer outro caso é conflito, já registrado na análise
        }

        copyRepository.saveAllAndFlush(newCopies);
        return newCopies.size() + reactivatedCount;
    }

    private static List<String> conflictingAccessionNumbers(List<CopyConflictResponse> conflicts) {
        return conflicts.stream().map(CopyConflictResponse::accessionNumber).distinct().toList();
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
