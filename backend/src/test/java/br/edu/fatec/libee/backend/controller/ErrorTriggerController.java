package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.exception.BusinessRuleException;
import br.edu.fatec.libee.backend.exception.ResourceNotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.constraints.Min;

@RestController
@RequestMapping("/test-errors")
public class ErrorTriggerController {
    @GetMapping("/unexpected")
    void unexpected() {
        throw new RuntimeException("detalhe interno secreto");
    }

    @GetMapping("/not-found")
    void notFound() {
        throw new ResourceNotFoundException("Livro não encontrado: id 99");
    }

    @GetMapping("/business-rule")
    void businessRule() {
        throw new BusinessRuleException("O exemplar já está emprestado.");
    }

    @GetMapping("/validated")
    void validated(@RequestParam @Min(1) int size) {
    }
}
