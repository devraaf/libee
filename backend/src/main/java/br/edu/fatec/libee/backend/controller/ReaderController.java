package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.dto.response.PageResponse;
import br.edu.fatec.libee.backend.dto.response.ReaderListItemResponse;
import br.edu.fatec.libee.backend.enums.AffiliationType;
import br.edu.fatec.libee.backend.enums.LoanStatus;
import br.edu.fatec.libee.backend.service.ReaderService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/readers")
@RequiredArgsConstructor
public class ReaderController {
    private final ReaderService readerService;

    // TODO: restringir a bibliotecário/administrador quando a autorização por perfil estiver definida
    @GetMapping
    public PageResponse<ReaderListItemResponse> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) AffiliationType linkType,
            @RequestParam(required = false) Integer courseId,
            @RequestParam(required = false) List<LoanStatus> loanStatus,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        return readerService.list(search, linkType, courseId, loanStatus, page, size);
    }
}