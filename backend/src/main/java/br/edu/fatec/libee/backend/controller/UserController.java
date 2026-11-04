package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.dto.request.RegisterLibrarianRequest;
import br.edu.fatec.libee.backend.dto.response.UserResponse;
import br.edu.fatec.libee.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/librarians")
    public ResponseEntity<UserResponse> createLibrarian(@Valid @RequestBody RegisterLibrarianRequest request){
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createLibrarian(request));
    }
}
