package io.devTracker.codeTracker.Service;

import io.devTracker.codeTracker.Model.User;
import io.devTracker.codeTracker.Repository.UserRepository;
import io.devTracker.codeTracker.Security.JwtUtil;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public User registerUser(String email, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already registered");
        }
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .provider("local")
                .build();
        return userRepository.save(user);
    }

    public Optional<String> loginUser(String email, String password) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty() || !passwordEncoder.matches(password, userOptional.get().getPassword())) {
            return Optional.empty();
        }
        String token = jwtUtil.generateToken(userOptional.get().getId(), userOptional.get().getEmail());
        return Optional.of(token);
    }
}
