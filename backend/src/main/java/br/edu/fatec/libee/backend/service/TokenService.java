package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.config.SecurityProperties;
import br.edu.fatec.libee.backend.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class TokenService {

    private final JwtEncoder jwtEncoder;
    private final SecurityProperties properties;

    public String generate(User user){
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("libee")
                .issuedAt(now)
                .expiresAt(now.plus(properties.jwt().expiration()))
                .subject(String.valueOf(user.getId()))
                .claim("profile", user.getProfile().name())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims))
                .getTokenValue();

    }
}
