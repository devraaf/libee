package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.dto.request.RegisterLibrarianRequest;
import br.edu.fatec.libee.backend.dto.request.UpdateCollaboratorRequest;
import br.edu.fatec.libee.backend.dto.response.UserResponse;
import br.edu.fatec.libee.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/collaborators")
    public ResponseEntity<List<UserResponse>> listCollaborators() {
        return ResponseEntity.ok(userService.listCollaborators());
    }

    @PostMapping("/librarians")
    public ResponseEntity<UserResponse> createLibrarian(@Valid @RequestBody RegisterLibrarianRequest request){
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createLibrarian(request));
    }

    @PutMapping("/collaborators/{id}")
    public ResponseEntity<UserResponse> updateCollaborator(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateCollaboratorRequest request
    ) {
        return ResponseEntity.ok(userService.updateCollaborator(id, request));
    }

    @DeleteMapping("/collaborators/{id}")
    public ResponseEntity<Void> deleteCollaborator(@PathVariable Integer id) {
        userService.deleteCollaborator(id);
        return ResponseEntity.noContent().build();
    }
}