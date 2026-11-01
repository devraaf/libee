package br.edu.fatec.libee.backend.client.book.googlebooks;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GoogleBooksResponse(
        Integer totalItems, List<Item> items
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Item(VolumeInfo volumeInfo){}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record VolumeInfo(
            String title,
            List<String> authors,
            String publisher,
            String publishedDate,
            String description,
            Integer pageCount,
            List<String> categories,
            ImageLinks imageLinks
    ){}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ImageLinks(String thumbnail){}
}
