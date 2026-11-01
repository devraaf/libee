package br.edu.fatec.libee.backend.util;

import br.edu.fatec.libee.backend.exception.InvalidIsbnException;

import java.util.Locale;
import java.util.regex.Pattern;

public final class IsbnNormalizer {
    private static final Pattern VALID_ISBN = Pattern.compile("^(\\d{9}[\\dX]|\\d{13})$");

    private IsbnNormalizer(){}

    public static String normalize(String isbn){
         if (isbn == null || isbn.isBlank()){
             throw new InvalidIsbnException("ISBN não pode ser vazio");
         }
         String normalized = isbn.replaceAll("[\\s-]", "").toUpperCase(Locale.ROOT);

         if(!VALID_ISBN.matcher(normalized).matches()){
             throw new InvalidIsbnException("ISBN inválido. Informe 10 ou 13 caracteres (o ISBN-10 pode terminar em X).");
         }
         return normalized;
    }
}
