package br.edu.fatec.libee.backend.controller;

import br.edu.fatec.libee.backend.dto.request.LoginRequest;
import br.edu.fatec.libee.backend.dto.request.RegisterReaderRequest;
import br.edu.fatec.libee.backend.dto.response.LoginResponse;
import br.edu.fatec.libee.backend.dto.response.UserResponse;
import br.edu.fatec.libee.backend.service.AuthService;
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
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterReaderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createReader(request));
    }
}
