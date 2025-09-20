package io.devTracker.codeTracker.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import io.devTracker.codeTracker.Model.Project;
import io.devTracker.codeTracker.Model.User;
import io.devTracker.codeTracker.Repository.ProjectRepository;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    // Helper class to provide context about project creation
    public static class ProjectCreationResult {
        private final Project project;
        private final boolean isNew;

        public ProjectCreationResult(Project project, boolean isNew) {
            this.project = project;
            this.isNew = isNew;
        }

        public Project getProject() {
            return project;
        }

        public boolean isNew() {
            return isNew;
        }
    }

    /**
     * Creates a new project or finds existing one for the specified user.
     *
     * @param name  the name of the project
     * @param userId the ID of the user creating the project
     * @return ProjectCreationResult containing the project and whether it was newly created
     */
    @CacheEvict(value={"projects","overview"},key="#userId")
    public ProjectCreationResult findOrCreateProject(String projectName, String userId) {
        Optional<Project> existingProject = projectRepository.findByNameAndUserId(projectName, userId);
        
        if (existingProject.isPresent()) {
            return new ProjectCreationResult(existingProject.get(), false); // Not new
        } else {
            Project newProject = Project.builder()
                .name(projectName)
                .userId(userId)
                .build();
            Project savedProject = projectRepository.save(newProject);
            return new ProjectCreationResult(savedProject, true); // Is new
        }
    }

    /**
     * Retrieves all projects for the specified user.
     *
     * @param user the ID of the user
     * @return a list of Project entities
     */

     @Cacheable(value="projects",key="#user.id")
    public List<Project> getProjectByUserId(User user){
        return projectRepository.findByUserId(user.getId());
    }

    
    /**
     * Retrieves a project by its ID for the specified user.
     *
     * @param projectId the ID of the project
     * @param user the user requesting the project
     * @return an Optional containing the Project entity if found, or empty if not found or access is denied
     */

    @Cacheable(value = "projects", key = "#projectId + '-' + #user.id")
    public Optional<Project> getProjectById(String projectId, User user) {
        return projectRepository.findById(projectId)
                .filter(project -> project.getUserId().equals(user.getId()));
    }


    /**
     * Updates the name of a project for the specified user.
     *
     * @param projectId the ID of the project to update
     * @param name the new name for the project
     * @param user the user requesting the update
     * @return an Optional containing the updated Project entity if found, or empty if not found or access is denied
     */

    @CacheEvict(value = {"projects", "overview"}, key = "#user.id")
    public Optional<Project> updateProject(String projectId, String name, User user) {
        return projectRepository.findById(projectId)
                .map(project -> {
                    if (!project.getUserId().equals(user.getId())) {
                        throw new SecurityException("Access denied");
                    }
                    project.setName(name);
                    return projectRepository.save(project);
                });
    }

    /**
     * Deletes a project for the specified user.
     *
     * @param projectId the ID of the project to delete
     * @param user the user requesting the deletion
     * @return true if the project was deleted, false if not found or access is denied
     */
    public boolean deleteProject(String projectId, User user) {
        return projectRepository.findById(projectId)
                .map(project -> {
                    if (!project.getUserId().equals(user.getId())) {
                        throw new SecurityException("Access denied");
                    }
                    projectRepository.delete(project);
                    return true;
                }).orElse(false);
    }
}
