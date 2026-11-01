package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.dto.response.PageResponse;
import br.edu.fatec.libee.backend.dto.response.ReaderLoanResponse;
import br.edu.fatec.libee.backend.dto.response.UpcomingReturnResponse;
import br.edu.fatec.libee.backend.enums.LoanStatus;
import br.edu.fatec.libee.backend.service.LoanService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
}
