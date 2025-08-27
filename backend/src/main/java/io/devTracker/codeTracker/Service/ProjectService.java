package io.devTracker.codeTracker.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import io.devTracker.codeTracker.Model.Project;
import io.devTracker.codeTracker.Repository.ProjectRepository;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    public Project createProject(String name,String userId){
        Project project = Project.builder()
            .name(name)
            .userId(userId)
            .build();
        return projectRepository.save(project);
    }
}
