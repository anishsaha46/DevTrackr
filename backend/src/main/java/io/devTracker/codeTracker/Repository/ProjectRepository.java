package io.devTracker.codeTracker.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import io.devTracker.codeTracker.Model.Project;

public interface ProjectRepository extends MongoRepository<Project, String> {
    List<Project> findByUserId(String userId);

    long countByUserId(String userId);

    Optional<Project> findTopByUserIdOrderByCreatedAtDesc(String userId);
} 
