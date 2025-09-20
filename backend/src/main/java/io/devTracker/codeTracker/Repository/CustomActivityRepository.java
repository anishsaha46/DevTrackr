package io.devTracker.codeTracker.Repository;

import io.devTracker.codeTracker.Model.Activity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CustomActivityRepository {
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    public List<Activity> saveAllWithLogging(List<Activity> activities) {
        System.out.println("Attempting to save " + activities.size() + " activities to MongoDB");
        activities.forEach(activity -> {
            System.out.println("Saving activity: projectId=" + activity.getProjectId() 
                + ", projectName=" + activity.getProjectName()
                + ", timeSpent=" + activity.getTimeSpent());
        });
        
        List<Activity> savedActivities = activities.stream()
            .map(activity -> mongoTemplate.insert(activity))
            .collect(java.util.stream.Collectors.toList());
        System.out.println("Successfully saved " + savedActivities.size() + " activities");
        return savedActivities;
    }
}