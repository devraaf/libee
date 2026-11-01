package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.entity.Book;
import br.edu.fatec.libee.backend.entity.Copy;
import br.edu.fatec.libee.backend.enums.CopyStatus;
import br.edu.fatec.libee.backend.exception.DeletionBlockedException;
import br.edu.fatec.libee.backend.exception.ResourceNotFoundException;
import br.edu.fatec.libee.backend.repository.BookRepository;
import br.edu.fatec.libee.backend.repository.CopyRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookServiceDeletionTest {

    @Mock
    private BookRepository bookRepository;
    @Mock private CopyRepository copyRepository;

    @InjectMocks
    private BookService service;

    @Captor
    private ArgumentCaptor<Instant> instantCaptor;

    // ---------- apoio ----------

    private Book book(int id) {
        Book book = new Book();
        book.setId(id);
        return book;
    }

    private Copy copy(int id, Book book, String accessionNumber, CopyStatus status) {
        Copy copy = new Copy();
        copy.setId(id);
        copy.setBook(book);
        copy.setAccessionNumber(accessionNumber);
        copy.setStatus(status);
        return copy;
    }

    // ---------- excluir livro ----------

    @Test
    @DisplayName("Deve excluir o livro e todos os seus exemplares com o mesmo instante")
    void shouldDeleteBookAndCopiesWithSameInstant() {
        Book book = book(1);
        when(bookRepository.findByIdAndDeletedAtIsNull(1)).thenReturn(Optional.of(book));
        when(copyRepository.findAccessionNumbersByBookIdAndStatus(1, CopyStatus.ON_LOAN)).thenReturn(List.of());

        service.deleteBook(1);

        assertNotNull(book.getDeletedAt());
        verify(copyRepository).softDeleteByBookId(eq(1), instantCaptor.capture());
        assertEquals(book.getDeletedAt(), instantCaptor.getValue());
    }

    @Test
    @DisplayName("Deve lançar DeletionBlockedException com os tombos emprestados e não excluir nada")
    void shouldBlockBookDeletionWhenCopiesAreOnLoan() {
        Book book = book(1);
        when(bookRepository.findByIdAndDeletedAtIsNull(1)).thenReturn(Optional.of(book));
        when(copyRepository.findAccessionNumbersByBookIdAndStatus(1, CopyStatus.ON_LOAN))
                .thenReturn(List.of("002", "005"));

        DeletionBlockedException exception = assertThrows(DeletionBlockedException.class,
                () -> service.deleteBook(1));

        assertEquals(List.of("002", "005"), exception.getAccessionNumbers());
        assertNull(book.getDeletedAt());
        verify(copyRepository, never()).softDeleteByBookId(anyInt(), any(Instant.class));
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando o livro não existe ou já foi excluído")
    void shouldThrowNotFoundWhenBookDoesNotExist() {
        when(bookRepository.findByIdAndDeletedAtIsNull(99)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.deleteBook(99));

        verifyNoInteractions(copyRepository);
    }

    // ---------- excluir exemplar ----------

    @Test
    @DisplayName("Deve excluir só o exemplar quando o livro tem outros exemplares ativos")
    void shouldDeleteOnlyTheCopyWhenBookHasOtherActiveCopies() {
        Book book = book(1);
        Copy copy = copy(10, book, "001", CopyStatus.AVAILABLE);
        when(copyRepository.findByIdAndBookIdAndDeletedAtIsNull(10, 1)).thenReturn(Optional.of(copy));
        when(copyRepository.countByBookIdAndDeletedAtIsNull(1)).thenReturn(2L);

        service.deleteCopy(1, 10);

        assertNotNull(copy.getDeletedAt());
        assertNull(book.getDeletedAt());
    }

    @Test
    @DisplayName("Deve excluir também o livro, com o mesmo instante, quando o exemplar é o último ativo")
    void shouldDeleteBookToo_whenCopyIsTheLastActiveOne() {
        Book book = book(1);
        Copy copy = copy(10, book, "001", CopyStatus.AVAILABLE);
        when(copyRepository.findByIdAndBookIdAndDeletedAtIsNull(10, 1)).thenReturn(Optional.of(copy));
        when(copyRepository.countByBookIdAndDeletedAtIsNull(1)).thenReturn(1L);

        service.deleteCopy(1, 10);

        assertNotNull(copy.getDeletedAt());
        assertEquals(copy.getDeletedAt(), book.getDeletedAt());
    }

    @Test
    @DisplayName("Deve lançar DeletionBlockedException e não excluir nada quando o exemplar está emprestado")
    void shouldBlockCopyDeletionWhenCopyIsOnLoan() {
        Book book = book(1);
        Copy copy = copy(10, book, "002", CopyStatus.ON_LOAN);
        when(copyRepository.findByIdAndBookIdAndDeletedAtIsNull(10, 1)).thenReturn(Optional.of(copy));

        DeletionBlockedException exception = assertThrows(DeletionBlockedException.class,
                () -> service.deleteCopy(1, 10));

        assertEquals(List.of("002"), exception.getAccessionNumbers());
        assertNull(copy.getDeletedAt());
        assertNull(book.getDeletedAt());
        verify(copyRepository, never()).countByBookIdAndDeletedAtIsNull(anyInt());
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando o exemplar não existe, já foi excluído ou é de outro livro")
    void shouldThrowNotFoundWhenCopyIsNotFoundInBook() {
        when(copyRepository.findByIdAndBookIdAndDeletedAtIsNull(10, 1)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.deleteCopy(1, 10));
    }
}