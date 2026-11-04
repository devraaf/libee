package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.dto.request.LoginRequest;
import br.edu.fatec.libee.backend.dto.response.LoginResponse;
import br.edu.fatec.libee.backend.entity.User;
import br.edu.fatec.libee.backend.exception.InvalidCredentialsException;
import br.edu.fatec.libee.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .filter(found -> passwordEncoder.matches(request.password(), found.getPasswordHash()))
                .orElseThrow(InvalidCredentialsException::new);

        return new LoginResponse(tokenService.generate(user), user.getId(), user.getProfile());
    }
}
