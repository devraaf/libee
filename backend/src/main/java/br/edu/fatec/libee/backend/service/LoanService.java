package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.dto.response.PageResponse;
import br.edu.fatec.libee.backend.dto.response.ReaderLoanResponse;
import br.edu.fatec.libee.backend.dto.response.UpcomingReturnResponse;
import br.edu.fatec.libee.backend.entity.Author;
import br.edu.fatec.libee.backend.entity.Book;
import br.edu.fatec.libee.backend.entity.Loan;
import br.edu.fatec.libee.backend.enums.LoanStatus;
import br.edu.fatec.libee.backend.repository.LoanRepository;
import br.edu.fatec.libee.backend.specification.LoanSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoanService {
    private final LoanRepository loanRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public PageResponse<ReaderLoanResponse> listByReader(
            Integer readerId, List<LoanStatus> statuses, String search, int page, int size) {

        LocalDate today = LocalDate.now(clock);
        // id desc como desempate, para a paginação ser estável
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("loanDate"), Sort.Order.desc("id")));

        Specification<Loan> spec = Specification.allOf(
                LoanSpecification.forReader(readerId),
                LoanSpecification.hasStatusIn(statuses, today),
                LoanSpecification.matchesSearch(search));

        Page<Loan> loans = loanRepository.findAll(spec, pageable);
        return PageResponse.from(loans.map(loan -> toResponse(loan, today)));
    }

    private ReaderLoanResponse toResponse(Loan loan, LocalDate today) {
        Book book = loan.getCopy().getBook();
        return new ReaderLoanResponse(
                loan.getId(),
                new ReaderLoanResponse.BookSummary(
                        book.getId(),
                        book.getTitle(),
                        book.getAuthors().stream().map(Author::getName).sorted().toList(),
                        book.getCoverImageUrl()),
                loan.getCopy().getAccessionNumber(),
                loan.getLoanDate(),
                loan.getDueDate(),
                loan.getReturnDate(),
                loan.getRenewalCount(),
                loan.getStatus(today));
    }

    @Transactional(readOnly = true)
    public List<UpcomingReturnResponse> listUpcomingReturns(Integer readerId, int limit){
        LocalDate today = LocalDate.now(clock);
        Pageable pageable = PageRequest.of(0, limit,
                Sort.by(Sort.Order.asc("dueDate"), Sort.Order.asc("id")));

        Specification<Loan> spec = Specification.allOf(
                LoanSpecification.forReader(readerId),
                LoanSpecification.hasStatusIn(List.of(LoanStatus.ON_TIME, LoanStatus.OVERDUE), today));

        return loanRepository.findAll(spec, pageable).getContent().stream()
                .map(loan -> new UpcomingReturnResponse(
                        loan.getId(),
                        loan.getCopy().getBook().getTitle(),
                        loan.getCopy().getBook().getAuthors().stream().map(Author::getName).sorted().toList(),
                        loan.getCopy().getBook().getPublicationYear(),
                        loan.getCopy().getBook().getCoverImageUrl(),
                        loan.getDueDate())).toList();
    }
}
