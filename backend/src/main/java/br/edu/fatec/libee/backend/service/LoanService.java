package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.dto.request.RegisterLoanRequest;
import br.edu.fatec.libee.backend.dto.request.RegisterReturnRequest;
import br.edu.fatec.libee.backend.dto.response.*;
import br.edu.fatec.libee.backend.entity.*;
import br.edu.fatec.libee.backend.enums.ActiveLoanStatus;
import br.edu.fatec.libee.backend.enums.CopyStatus;
import br.edu.fatec.libee.backend.enums.LoanStatus;
import br.edu.fatec.libee.backend.enums.UserProfile;
import br.edu.fatec.libee.backend.exception.CopyAlreadyOnLoanException;
import br.edu.fatec.libee.backend.exception.CopyNotOnLoanException;
import br.edu.fatec.libee.backend.exception.LoanNotRenewableException;
import br.edu.fatec.libee.backend.exception.ResourceNotFoundException;
import br.edu.fatec.libee.backend.repository.CopyRepository;
import br.edu.fatec.libee.backend.repository.LoanRepository;
import br.edu.fatec.libee.backend.repository.UserRepository;
import br.edu.fatec.libee.backend.specification.LoanSpecification;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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
    private final CopyRepository copyRepository;
    private final UserRepository userRepository;
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

    @Transactional(readOnly = true)
    public LoanSummaryResponse getSummary() {
        LocalDate today = LocalDate.now(clock);
        long onTime = loanRepository.count(
                LoanSpecification.hasStatusIn(List.of(LoanStatus.ON_TIME), today));
        long overdue = loanRepository.count(
                LoanSpecification.hasStatusIn(List.of(LoanStatus.OVERDUE), today));
        return new LoanSummaryResponse(onTime + overdue, onTime, overdue);
    }

    @Transactional(readOnly = true)
    public PageResponse<ActiveLoanResponse> listActiveLoans(List<ActiveLoanStatus> statuses, String search, int page, int size){
        LocalDate today = LocalDate.now(clock);
        Pageable pageable = PageRequest.of(page, size, Sort.by("dueDate", "id"));

        List<LoanStatus> filter = (statuses == null || statuses.isEmpty())
                ? List.of(LoanStatus.ON_TIME, LoanStatus.OVERDUE)
                : statuses.stream().map(ActiveLoanStatus::toLoanStatus).toList();

        Specification<Loan> spec = Specification.allOf(
                LoanSpecification.hasStatusIn(filter, today),
                LoanSpecification.matchesManagementSearch(search));

        Page<Loan> loans = loanRepository.findAll(spec, pageable);
        return PageResponse.from(loans.map(loan -> toActiveResponse(loan, today)));
    }

    private ActiveLoanResponse toActiveResponse(Loan loan, LocalDate today) {
        return new ActiveLoanResponse(
                loan.getId(),
                loan.getReader().getName(),
                loan.getCopy().getBook().getTitle(),
                loan.getCopy().getAccessionNumber(),
                loan.getLoanDate(),
                loan.getDueDate(),
                loan.getRenewalCount(),
                loan.getStatus(today));
    }

    @Transactional(readOnly = true)
    public PageResponse<ReturnLoanResponse> listReturns(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("returnDate"), Sort.Order.desc("id")));

        Specification<Loan> spec = Specification.allOf(
                LoanSpecification.returned(),
                LoanSpecification.matchesManagementSearch(search));

        Page<Loan> loans = loanRepository.findAll(spec, pageable);
        return PageResponse.from(loans.map(this::toReturnResponse));
    }

    private ReturnLoanResponse toReturnResponse(Loan loan) {
        return new ReturnLoanResponse(
                loan.getId(),
                loan.getReader().getName(),
                loan.getCopy().getBook().getTitle(),
                loan.getCopy().getAccessionNumber(),
                loan.getReturnDate()
        );
    }

    @Transactional
    public ActiveLoanResponse register(Integer librarianId, RegisterLoanRequest request) {
        LocalDate today = LocalDate.now(clock);

        // TODO: some quando o login (UC01) estiver pronto; o bibliotecário virá do usuário autenticado
        User librarian = userRepository.findById(librarianId)
                .orElseThrow(() -> new ResourceNotFoundException("Bibliotecário não encontrado com o ID informado."));

        // Usuário que existe mas não é leitor também é "não encontrado"
        User reader = userRepository.findByIdAndProfile(request.readerId(), UserProfile.READER)
                .orElseThrow(() -> new ResourceNotFoundException("Leitor não encontrado com o ID informado."));

        Copy copy = copyRepository.findByAccessionNumberAndDeletedAtIsNull(request.accessionNumber().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Exemplar não encontrado com o tombo informado."));

        if (copy.getStatus() == CopyStatus.ON_LOAN) {
            throw new CopyAlreadyOnLoanException(copy.getAccessionNumber());
        }

        Loan loan = new Loan();
        loan.setCopy(copy);
        loan.setReader(reader);
        loan.setLibrarian(librarian);
        loan.setLoanDate(today);
        loan.setDueDate(request.dueDate());   // renewalCount já começa em 0

        copy.setStatus(CopyStatus.ON_LOAN);

        Loan saved = loanRepository.saveAndFlush(loan);
        return toActiveResponse(saved, today);
    }

    @Transactional
    public ReturnLoanResponse registerReturn(RegisterReturnRequest request) {
        LocalDate today = LocalDate.now(clock);

        Copy copy = copyRepository.findByAccessionNumberAndDeletedAtIsNull(request.accessionNumber().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Exemplar não encontrado com o tombo informado."));

        Loan loan = loanRepository.findByCopyIdAndReturnDateIsNull(copy.getId())
                .orElseThrow(() -> new CopyNotOnLoanException(copy.getAccessionNumber()));

        loan.setReturnDate(today);
        copy.setStatus(CopyStatus.AVAILABLE);   // mesma transação da devolução

        loanRepository.saveAndFlush(loan);      // grava empréstimo e exemplar juntos
        return new ReturnLoanResponse(
                loan.getId(),
                loan.getReader().getName(),
                copy.getBook().getTitle(),
                copy.getAccessionNumber(),
                loan.getReturnDate());
    }

    private static final int RENEWAL_DAYS = 7;

    @Transactional
    public ReaderLoanResponse renew(Integer readerId, Integer loanId) {
        LocalDate today = LocalDate.now(clock);

        // Inexistente ou de outro leitor: o mesmo 404
        Loan loan = loanRepository.findByIdAndReaderId(loanId, readerId)
                .orElseThrow(() -> new ResourceNotFoundException("Empréstimo não encontrado com o ID informado."));

        switch (loan.getStatus(today)) {
            case RETURNED -> throw new LoanNotRenewableException("O empréstimo já foi devolvido.");
            case OVERDUE -> throw new LoanNotRenewableException(
                    "O empréstimo está atrasado e não pode ser renovado. Devolva o livro ao bibliotecário.");
            case ON_TIME -> { }
        }

        loan.setDueDate(loan.getDueDate().plusDays(RENEWAL_DAYS));
        loan.setRenewalCount(loan.getRenewalCount() + 1);

        loanRepository.saveAndFlush(loan);
        return toResponse(loan, today);
    }
}
