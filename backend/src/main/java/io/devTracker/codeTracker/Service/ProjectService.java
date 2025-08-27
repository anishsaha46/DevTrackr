package io.devTracker.codeTracker.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import io.devTracker.codeTracker.Model.Project;
import io.devTracker.codeTracker.Model.User;
import io.devTracker.codeTracker.Repository.ProjectRepository;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    /**
     * Creates a new project for the specified user.
     *
     * @param name  the name of the project
     * @param userId the ID of the user creating the project
     * @return the created Project entity
     */
    public Project createProject(String name,String userId){
        Project project = Project.builder()
            .name(name)
            .userId(userId)
            .build();
        return projectRepository.save(project);
    }

    /**
     * Retrieves all projects for the specified user.
     *
     * @param userId the ID of the user
     * @return a list of Project entities
     */
    public List<Project> getProjectByUserId(String userId){
        return projectRepository.findByUserId(userId);
    }

    
    /**
     * Retrieves a project by its ID for the specified user.
     *
     * @param projectId the ID of the project
     * @param user the user requesting the project
     * @return an Optional containing the Project entity if found, or empty if not found or access is denied
     */
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
