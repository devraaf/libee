package br.edu.fatec.libee.backend.event;

import java.time.LocalDate;

public record LoanRegisteredEvent(
        Integer loanId,
        String readerName,
        String readerEmail,
        String bookTitle,
        LocalDate dueDate){
}
