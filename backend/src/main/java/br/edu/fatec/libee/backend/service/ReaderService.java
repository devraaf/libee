package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.dto.response.ReaderSummaryResponse;
import br.edu.fatec.libee.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class ReaderService {
    private final Clock clock;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ReaderSummaryResponse getSummary() {
        var summary = userRepository.summarizeReaders(LocalDate.now(clock));
        return new ReaderSummaryResponse(
                summary.getTotalReaders(),
                summary.getReadersWithActiveLoans(),
                summary.getReadersWithOverdueLoans());
    }
}
