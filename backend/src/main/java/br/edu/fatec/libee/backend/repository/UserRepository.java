package br.edu.fatec.libee.backend.repository;

import br.edu.fatec.libee.backend.entity.User;
import br.edu.fatec.libee.backend.enums.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByIdAndProfile(Integer id, UserProfile profile);
}
