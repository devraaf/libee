package br.edu.fatec.libee.backend.enums;

public enum ActiveLoanStatus {
    ON_TIME(LoanStatus.ON_TIME),
    OVERDUE(LoanStatus.OVERDUE);

    private final LoanStatus loanStatus;

    ActiveLoanStatus(LoanStatus loanStatus) {
        this.loanStatus = loanStatus;
    }

    public LoanStatus toLoanStatus() {
        return loanStatus;
    }
}
