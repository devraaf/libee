package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.dto.request.RegisterLoanRequest;
import br.edu.fatec.libee.backend.dto.response.*;
import br.edu.fatec.libee.backend.enums.ActiveLoanStatus;
import br.edu.fatec.libee.backend.enums.LoanStatus;
import br.edu.fatec.libee.backend.service.LoanService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/loans")
@RequiredArgsConstructor
public class LoanController {
    private final LoanService loanService;

    @GetMapping
    public PageResponse<ReaderLoanResponse> listMyLoans(
            // TODO: remover quando o login (UC01) estiver pronto; passar a usar o id do usuário autenticado
            @RequestParam Integer readerId,
            @RequestParam(required = false) List<LoanStatus> status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        return loanService.listByReader(readerId, status, search, page, size);
    }

    @GetMapping("/upcoming-returns")
    public List<UpcomingReturnResponse> listUpcomingReturns(
            // TODO: remover quando o login (UC01) estiver pronto; passar a usar o id do usuário autenticado
            @RequestParam Integer readerId,
            @RequestParam(defaultValue = "3") @Min(1) @Max(5) int limit){
        return loanService.listUpcomingReturns(readerId, limit);
    }

    // TODO: restringir a bibliotecário/administrador quando a autenticação existir
    @GetMapping("/management/summary")
    public ResponseEntity<LoanSummaryResponse> getSummary(){
        return ResponseEntity.ok(loanService.getSummary());
    }

    // TODO: restringir a bibliotecário/administrador quando a autenticação existir
    @GetMapping("/management")
    public PageResponse<ActiveLoanResponse> listActiveLoans(
            @RequestParam(required = false) List<ActiveLoanStatus> status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size){
        return loanService.listActiveLoans(status, search, page, size);
    }

    // TODO: restringir a bibliotecário/administrador quando a autenticação existir
    @GetMapping("/management/returns")
    public PageResponse<ReturnLoanResponse> listReturns(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size){
        return loanService.listReturns(search, page, size);
    }

    // TODO: restringir a bibliotecário/administrador quando a autenticação existir
    @PostMapping
    public ResponseEntity<ActiveLoanResponse> register(
            // TODO: remover quando o login (UC01) estiver pronto; passar a usar o id do usuário autenticado
            @RequestParam Integer librarianId,
            @Valid @RequestBody RegisterLoanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(loanService.register(librarianId, request));
    }
}


