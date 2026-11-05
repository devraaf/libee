package br.edu.fatec.libee.backend.security;

import br.edu.fatec.libee.backend.AbstractIntegrationTest;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class RouteSecurityIT extends AbstractIntegrationTest {

    private static final List<String> ALL = List.of("READER", "LIBRARIAN", "ADMINISTRATOR");
    private static final List<String> STAFF = List.of("LIBRARIAN", "ADMINISTRATOR");

    private record Route(HttpMethod method, String path, List<String> allowedRoles) {}

    // Espelha o SecurityConfig. Ids fictícios: a segurança responde antes de o controller buscar o recurso
    private static final List<Route> ROUTES = List.of(
            new Route(HttpMethod.POST, "/users/librarians", List.of("ADMINISTRATOR")),
            new Route(HttpMethod.POST, "/courses", List.of("ADMINISTRATOR")),
            new Route(HttpMethod.GET, "/books/management", List.of("LIBRARIAN")),
            new Route(HttpMethod.GET, "/books/management/summary", List.of("LIBRARIAN")),
            new Route(HttpMethod.GET, "/books/management/lookup", List.of("LIBRARIAN")),
            new Route(HttpMethod.GET, "/loans/management", List.of("LIBRARIAN")),
            new Route(HttpMethod.POST, "/books", List.of("LIBRARIAN")),
            new Route(HttpMethod.POST, "/loans", List.of("LIBRARIAN")),
            new Route(HttpMethod.POST, "/loans/returns", List.of("LIBRARIAN")),
            new Route(HttpMethod.POST, "/categories", List.of("LIBRARIAN")),
            new Route(HttpMethod.DELETE, "/books/1", List.of("LIBRARIAN")),
            new Route(HttpMethod.DELETE, "/books/1/copies/1", List.of("LIBRARIAN")),
            new Route(HttpMethod.GET, "/readers/summary", STAFF),
            new Route(HttpMethod.GET, "/loans", List.of("READER")),
            new Route(HttpMethod.GET, "/loans/upcoming-returns", List.of("READER")),
            new Route(HttpMethod.PATCH, "/loans/1", List.of("READER")),
            new Route(HttpMethod.GET, "/books", ALL),
            new Route(HttpMethod.GET, "/books/1", ALL),
            new Route(HttpMethod.GET, "/categories", ALL));

    static Stream<Arguments> routesAndRoles() {
        return ROUTES.stream().flatMap(route -> ALL.stream().map(role ->
                Arguments.of(route.method(), route.path(), role, route.allowedRoles().contains(role))));
    }

    static Stream<Arguments> protectedRoutes() {
        return ROUTES.stream().map(route -> Arguments.of(route.method(), route.path()));
    }

    @ParameterizedTest(name = "{0} {1} com {2} → permitido: {3}")
    @MethodSource("routesAndRoles")
    void enforcesRolePermissions(HttpMethod method, String path, String role, boolean allowed) throws Exception {
        int status = mockMvc.perform(request(method, path)
                        .with(user("teste").roles(role))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andReturn().getResponse().getStatus();

        if (allowed) {
            assertNotEquals(401, status);
            assertNotEquals(403, status);
        } else {
            assertEquals(403, status);
        }
    }

    // Sem usuário autenticado (nenhuma anotação de usuário nesta classe)
    @ParameterizedTest(name = "Retorna 401 sem autenticação em {0} {1}")
    @MethodSource("protectedRoutes")
    void returnsUnauthorized_whenUserIsAnonymous(HttpMethod method, String path) throws Exception {
        mockMvc.perform(request(method, path)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.title").value("Não autenticado"));
    }
}
