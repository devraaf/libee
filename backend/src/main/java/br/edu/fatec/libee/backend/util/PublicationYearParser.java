package br.edu.fatec.libee.backend.util;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class PublicationYearParser {
    private static final Pattern YEAR = Pattern.compile("\\b(1[5-9]\\d{2}|20\\d{2})\\b");

    private PublicationYearParser() {}

    public static Optional<Integer> parse(String raw) {
        if (raw == null || raw.isBlank()){
           return Optional.empty();
        }
        Matcher m = YEAR.matcher(raw);
        if (m.find()) {
           return Optional.of(Integer.parseInt(m.group(1)));
        }
        return Optional.empty();
    }
}
