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

    public String generateToken(User user) {
        return jwtUtil.generateToken(user.getId(), user.getEmail());
    }

    public User findOrCreateGitHubUser(String email, String username, String name, String githubToken) {
        Optional<User> existingUser = userRepository.findByEmail(email);
        
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            // Update existing user with GitHub info
            user.setProvider("github");
            user.setUsername(username);
            user.setName(name);
            // You might want to store the GitHub token securely
            return userRepository.save(user);
        } else {
            // Create new GitHub user
            User newUser = User.builder()
                    .email(email)
                    .username(username)
                    .name(name)
                    .provider("github")
                    .password("") // No password for OAuth users
                    .build();
            return userRepository.save(newUser);
        }
    }

        public User findOrCreateGoogleUser(String email, String name, String picture, String googleToken) {
        Optional<User> existingUser = userRepository.findByEmail(email);
        
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            // Update existing user with Google info
            user.setProvider("google");
            user.setName(name);
            // You might want to store the Google token securely
            return userRepository.save(user);
        } else {
            // Create new Google user
            User newUser = User.builder()
                    .email(email)
                    .name(name)
                    .provider("google")
                    .password("") // No password for OAuth users
                    .build();
            return userRepository.save(newUser);
        }
    }

    
}
