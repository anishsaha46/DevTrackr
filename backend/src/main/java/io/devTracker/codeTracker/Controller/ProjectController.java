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
}
