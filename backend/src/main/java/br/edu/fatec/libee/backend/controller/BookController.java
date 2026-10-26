package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.dto.response.*;
import br.edu.fatec.libee.backend.service.BookService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/books")
@RequiredArgsConstructor
public class BookController {
    private final BookService bookService;

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

    // TODO: restringir a bibliotecário/administrador quando a autenticação existir
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
}
