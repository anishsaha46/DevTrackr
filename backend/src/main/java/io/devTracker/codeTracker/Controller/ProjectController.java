package io.devTracker.codeTracker.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import io.devTracker.codeTracker.Model.User;
import io.devTracker.codeTracker.Dto.ProjectDTO;
import io.devTracker.codeTracker.Model.Project;
import io.devTracker.codeTracker.Repository.ActivityRepository;
import io.devTracker.codeTracker.Service.ProjectService;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    
    @Autowired
    private ProjectService projectService;

    @Autowired
    private ActivityRepository activityRepository;

    /**
     * Helper method to convert a Project entity to a ProjectResponse DTO.
     * Includes activity count related to the project for the user.
     */
    private ProjectDTO.ProjectResponse convertToResponse(Project project) {
        // Count the number of activities associated with this project and user
        long count = activityRepository.countByUserIdAndProjectName(project.getUserId(), project.getName());

        // Return a response object with project and activity details
        return new ProjectDTO.ProjectResponse(
                project.getId(),
                project.getName(),
                project.getUserId(),
                project.getCreatedAt().toInstant(),
                project.getUpdatedAt().toInstant(),
                count
        );
    }

    /**
     * Create a new project.
     * Endpoint: POST /api/projects
     */
    @PostMapping
    public ResponseEntity<ProjectDTO.ProjectResponse> createProject(
            @RequestBody ProjectDTO.CreateProjectRequest req,
            @AuthenticationPrincipal User user // Gets the currently authenticated user
    ) {
        // Create a new project using service logic
        Project createdProject = projectService.createProject(req.name(), user.getId());

        // Convert the project to a response DTO
        ProjectDTO.ProjectResponse response = convertToResponse(createdProject);

        // Return the response with HTTP 201 (Created)
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Get all projects for the currently authenticated user.
     * Endpoint: GET /api/projects
     */
    @GetMapping
    public List<ProjectDTO.ProjectResponse> getProjects(@AuthenticationPrincipal User user) {
        // Retrieve all projects belonging to the current user
        List<Project> projects = projectService.getProjectByUserId(user);

        // Convert each project to a DTO using a stream
        return projects.stream()
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



}
