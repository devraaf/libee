package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.client.book.BookMetadata;
import br.edu.fatec.libee.backend.client.book.BookMetadataProvider;
import br.edu.fatec.libee.backend.exception.BookAlreadyRegisteredException;
import br.edu.fatec.libee.backend.exception.ExternalServiceException;
import br.edu.fatec.libee.backend.exception.ResourceNotFoundException;
import br.edu.fatec.libee.backend.repository.BookRepository;
import br.edu.fatec.libee.backend.util.IsbnNormalizer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class BookLookupService {
    private final BookRepository bookRepository;
    private final List<BookMetadataProvider> providers;

    public BookLookupService(BookRepository bookRepository, List<BookMetadataProvider> providers) {
        this.bookRepository = bookRepository;
        this.providers = providers;
    }

    public BookMetadata lookupByIsbn(String rawIsbn){
        String isbn = IsbnNormalizer.normalize(rawIsbn);

        bookRepository.findByIsbn(isbn).ifPresent(book -> {
            throw new BookAlreadyRegisteredException(book.getId());
        });

        boolean anyProviderFailed = false;

        for (BookMetadataProvider provider : providers){
            String providerName = provider.name();
            try {
                Optional<BookMetadata> found = provider.findByIsbn(isbn);
                if(found.isPresent()){
                    log.info("ISBN {} encontrado por {}", isbn, providerName);
                    return found.get();
                }
                log.info("ISBN {} não encontrado em {}", isbn, providerName);
            }
            catch (ExternalServiceException e){
                anyProviderFailed = true;
                log.warn("{} falhou, tentando próximo provider", providerName);
            }
        }
        if (anyProviderFailed){
            throw new ExternalServiceException("Os serviços de consulta de livros estão indisponíveis no momento. Tente novamente ou continue com o cadastro manual.");
        }
        throw new ResourceNotFoundException("Não encontramos dados para este ISBN. Você pode continuar com o cadastro manual.");
    }
}
