package br.edu.fatec.libee.backend.enums;

import java.time.LocalDate;

/** Situação do empréstimo. Não é gravada no banco: é calculada a partir das datas. */
public enum LoanStatus {
    ON_TIME,    // em dia
    OVERDUE,    // atrasado
    RETURNED;   // devolvido

    /** Regra única de cálculo, usada pela entidade, pelos DTOs e pelos testes. */
    public static LoanStatus of(LocalDate dueDate, LocalDate returnDate, LocalDate today) {
        if (returnDate != null) return RETURNED;
        return today.isAfter(dueDate) ? OVERDUE : ON_TIME;
    }
}
