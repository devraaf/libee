package br.edu.fatec.libee.backend.client.book;

import br.edu.fatec.libee.backend.exception.ExternalServiceException;

import java.util.Optional;

public interface BookMetadataProvider {
    String name();
    /**
     * @param isbn ISBN já normalizado
     * @return os dados do livro, ou vazio se o provider respondeu que não o conhece
     * @throws ExternalServiceException se o provider falhou (timeout, indisponível, cota excedida)
     */
    Optional<BookMetadata> findByIsbn(String isbn);

}
