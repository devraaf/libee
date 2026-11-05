package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.model.User;
import br.edu.fatec.libee.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
@Transactional
class ReaderControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        // Insere dados de teste simulando utilizadores com perfil de leitor/estudante
        User reader1 = new User();
        reader1.setName("Ana Silva");
        reader1.setEmail("ana.silva@fatec.br");
        reader1.setRole("READER");
        userRepository.save(reader1);

        User reader2 = new User();
        reader2.setName("Carlos Souza");
        reader2.setEmail("carlos.souza@fatec.br");
        reader2.setRole("READER");
        userRepository.save(reader2);
    }

    @Test
    @DisplayName("Deve listar todos os readers com sucesso quando autenticado")
    @WithMockUser(username = "admin@fatec.br", roles = {"ADMIN"})
    void shouldListAllReadersSuccessfully() throws Exception {
        mockMvc.perform(get("/readers")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].name").exists())
                .andExpect(jsonPath("$.content[1].name").exists());
    }

    @Test
    @DisplayName("Deve filtrar readers por nome com sucesso")
    @WithMockUser(username = "admin@fatec.br", roles = {"ADMIN"})
    void shouldFilterReadersByNameSuccessfully() throws Exception {
        mockMvc.perform(get("/readers")
                        .param("name", "Ana")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Ana Silva"));
    }

    @Test
    @DisplayName("Deve retornar não autorizado quando utilizador não estiver autenticado")
    void shouldReturnUnauthorizedWhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/readers")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}