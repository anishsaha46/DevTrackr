package io.devTracker.codeTracker.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Date;
import java.util.stream.Collectors;

import io.devTracker.codeTracker.Model.User;
import io.devTracker.codeTracker.Dto.ProjectDTO;
import io.devTracker.codeTracker.Model.Project;
// import io.devTracker.codeTracker.Repository.ActivityRepository;
import io.devTracker.codeTracker.Service.ProjectService;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    
    @Autowired
    private ProjectService projectService;

    /**
     * Helper method to convert a Project entity to a ProjectResponse DTO.
     */
    private ProjectDTO.ProjectResponse convertToResponse(Project project) {
        return new ProjectDTO.ProjectResponse(
            project.getId(),
            project.getName(),
            project.getCreatedAt() != null ? project.getCreatedAt().toInstant() : new Date().toInstant()
        );
    }

    /**
     * Create a new project if it doesn't exist.
     * This is called by the VS Code extension when a folder is opened.
     * Endpoint: POST /api/projects
     */
    @PostMapping
    public ResponseEntity<ProjectDTO.ProjectResponse> createProject(
            @RequestBody ProjectDTO.CreateProjectRequest req,
            @AuthenticationPrincipal User user
    ) {
        // The service now returns a special wrapper object
        ProjectService.ProjectCreationResult result = projectService.findOrCreateProject(req.name(), user.getId());
        
        // Convert to the simplified DTO
        ProjectDTO.ProjectResponse response = convertToResponse(result.getProject());

        // Return 201 Created if it's new, 200 OK if it already existed
        if (result.isNew()) {
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } else {
            return ResponseEntity.ok(response);
        }
    }

    /**
     * Get all projects for the currently authenticated user.
     * Endpoint: GET /api/projects
     */
    @GetMapping
    public List<ProjectDTO.ProjectResponse> getProjects(@AuthenticationPrincipal User user) {
        return projectService.getProjectByUserId(user).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific project by its ID, checking user ownership.
     * Endpoint: GET /api/projects/{projectId}
     */
    @GetMapping("/{projectId}")
    public ResponseEntity<?> getProjectById(
            @PathVariable String projectId,
            @AuthenticationPrincipal User user
    ) {
        // Try to fetch the project for this user
        Optional<Project> project = projectService.getProjectById(projectId, user);

        if (project.isPresent()) {
            // Convert and return if found
            ProjectDTO.ProjectResponse response = convertToResponse(project.get());
            return ResponseEntity.ok(response);
        } else {
            // Return 404 if not found
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Project not found"));
        }
    }

    /**
     * Update a project's name.
     * Endpoint: PUT /api/projects/{projectId}
     */
    @PutMapping("/{projectId}")
    public ResponseEntity<?> updateProject(
            @PathVariable String projectId,
            @RequestBody ProjectDTO.UpdateProjectRequest req,
            @AuthenticationPrincipal User user
    ) {
        try {
            // Attempt to update the project
            Optional<Project> updatedProject = projectService.updateProject(projectId, req.name(), user);

            if (updatedProject.isPresent()) {
                // If update is successful, return updated project
                ProjectDTO.ProjectResponse response = convertToResponse(updatedProject.get());
                return ResponseEntity.ok(response);
            } else {
                // If not found, return 404
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Project not found"));
            }
        } catch (SecurityException e) {
            // If the user is unauthorized to update, return 403
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

        /**
    * Delete a project.
    * Endpoint: DELETE /api/projects/{projectId}
     */
    @DeleteMapping("/{projectId}")
    public ResponseEntity<?> deleteProject(
            @PathVariable String projectId,
            @AuthenticationPrincipal User user
    ) {
        try {
            // Attempt to delete the project
            if (projectService.deleteProject(projectId, user)) {
                // If deleted, return 204 No Content
                return ResponseEntity.noContent().build();
            } else {
                // If not found, return 404
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Project not found"));
            }
        } catch (SecurityException e) {
            // If the user is unauthorized to delete, return 403
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }


}
