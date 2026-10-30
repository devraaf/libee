package br.edu.fatec.libee.backend.client.book.openlibrary;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OpenLibraryResponse(
        String title,
        List<Named> authors,
        List<Named> publishers,
        @JsonProperty("publish_date") String publishDate,
        @JsonProperty("publish_places") List<Named> publishPlaces,
        @JsonProperty("number_of_pages") Integer numberOfPages,
        List<Named> subjects,
        Cover cover
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Named(String name) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Cover(String small, String medium, String large) {}
}
