package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.dto.response.ReaderSummaryResponse;
import br.edu.fatec.libee.backend.service.ReaderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/readers")
@RequiredArgsConstructor
public class ReaderController {

    private final ReaderService readerService;

    @GetMapping("/summary")
    public ResponseEntity<ReaderSummaryResponse> readerSummary(){
        return ResponseEntity.ok(readerService.getSummary());
    }
}
