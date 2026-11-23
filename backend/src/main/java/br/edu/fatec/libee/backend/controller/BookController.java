package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.dto.request.AddCopiesRequest;
import br.edu.fatec.libee.backend.dto.request.CopyRequest;
import br.edu.fatec.libee.backend.dto.request.RegisterBookRequest;
import br.edu.fatec.libee.backend.dto.request.UpdateBookRequest;
import br.edu.fatec.libee.backend.dto.response.*;
import br.edu.fatec.libee.backend.service.BookLookupService;
import br.edu.fatec.libee.backend.service.BookService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/books")
@RequiredArgsConstructor
public class BookController {
    private final BookService bookService;
    private final BookLookupService lookupService;

    @GetMapping
    public PageResponse<BookListItemResponse> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam( defaultValue = "0") @Min(0) int page,
            @RequestParam( defaultValue = "10") @Min(1) @Max(100) int size){
        return bookService.list(q, categoryId, page, size);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookDetailsResponse> getBookById(@PathVariable("id") Integer id){
        return ResponseEntity.ok(bookService.getBookById(id));
    }

    @GetMapping("/management")
    public PageResponse<BookManagementItemResponse> listForManagement(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size){
        return bookService.listForManagement(q, categoryId, page, size);
    }

    @GetMapping("/management/summary")
    public ResponseEntity<BookManagementSummaryResponse> getManagementSummary() {
        return ResponseEntity.ok(bookService.getManagementSummary());
    }

    @GetMapping("/management/lookup")
    public BookLookupResponse lookupByIsbn(
            @RequestParam(required = false) String isbn){
        return BookLookupResponse.from(lookupService.lookupByIsbn(isbn));
    }

    @PostMapping
    public ResponseEntity<BookDetailsResponse> register(@Valid @RequestBody RegisterBookRequest request) {
        Integer id = bookService.register(request);
        BookDetailsResponse body = bookService.getBookById(id);
        URI location = URI.create("/books/" + id);
        return ResponseEntity.created(location).body(body);
    }

        @PutMapping("/{id}")
    public ResponseEntity<Void> updateBook(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateBookRequest request) {

        bookService.updateBook(id, request);
        return ResponseEntity.noContent().build(); // Retorna HTTP 204 No Content
    }

    @PostMapping("/{bookId}/copies")
    public ResponseEntity<AddCopiesResponse> createCopies(@PathVariable Integer bookId, @Valid @RequestBody AddCopiesRequest request) {
        List<CopyConflictResponse> conflicts = bookService.createCopies(bookId, request);
        BookDetailsResponse book = bookService.getBookById(bookId);
        return ResponseEntity.status(HttpStatus.CREATED).body(new AddCopiesResponse(book, conflicts));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(@PathVariable Integer id) {
        bookService.deleteBook(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{bookId}/copies/{copyId}")
    public ResponseEntity<Void> deleteCopy(@PathVariable Integer bookId, @PathVariable Integer copyId) {
        bookService.deleteCopy(bookId, copyId);
        return ResponseEntity.noContent().build();
    }
}
