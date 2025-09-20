package io.devTracker.codeTracker.Service;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;

import io.devTracker.codeTracker.Model.Project;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import io.devTracker.codeTracker.Dto.ActivityDTO;
import io.devTracker.codeTracker.Model.User;
import io.devTracker.codeTracker.Model.Activity;
import io.devTracker.codeTracker.Repository.ActivityRepository;


@Service
public class ActivityService {
    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private ProjectService projectService;


    @CacheEvict(value = {"overview", "projectActivities", "heatmap"}, 
               key = "#user.id", 
               condition = "#activityRequests != null && !#activityRequests.isEmpty()")
    public List<Activity> submitActivities(List<ActivityDTO.ActivityRequest> activityRequests, User user) {
        List<Activity> activities = activityRequests.stream()
                .map(req -> {
                    // Find or create the project to get its ID
                    Project project = projectService.findOrCreateProject(req.projectName(), user.getId()).getProject();
                    
                    // Build the activity with the correct projectId
                    return Activity.builder()
                        .userId(user.getId())
                        .projectId(project.getId())
                        .projectName(req.projectName())
                        .language(req.language())
                        .startTime(java.sql.Timestamp.from(req.startTime()))
                        .endTime(java.sql.Timestamp.from(req.endTime()))
                        .file(req.file())
                        .timeSpent(req.timeSpent())
                        .sessionId(req.sessionId())
                        .fileExtension(req.fileExtension())
                        .build();
                })
                .collect(Collectors.toList());
        return activityRepository.saveAll(activities);
    }


    @CacheEvict(value = {"overview", "projectActivities", "heatmap"}, 
               key = "#user.id", 
               allEntries = true,
               condition = "#activityRequests != null && !#activityRequests.isEmpty()")
    public List<Activity> submitBatchActivities(List<ActivityDTO.ActivityRequest> activityRequests, User user) {
        System.out.println("\n========== ACTIVITY BATCH START ==========");
        System.out.println("👤 User: " + user.getId());
        System.out.println("📊 Activities to process: " + activityRequests.size());
        
        List<Activity> activities = activityRequests.stream()
                .map(req -> {
                    try {
        System.out.println("\n📁 Project: " + req.projectName());
        Project project = projectService.findOrCreateProject(req.projectName(), user.getId()).getProject();
        System.out.println("🆔 Project ID: " + project.getId());                        // Build the activity with the correct projectId
                        Activity activity = Activity.builder()
                            .userId(user.getId())
                            .projectId(project.getId())
                            .projectName(req.projectName())
                            .language(req.language())
                            .startTime(java.sql.Timestamp.from(req.startTime()))
                            .endTime(java.sql.Timestamp.from(req.endTime()))
                            .file(req.file())
                            .timeSpent(req.timeSpent())
                            .sessionId(req.sessionId())
                            .fileExtension(req.fileExtension())
                            .build();
                        System.out.println("Built activity: [projectId=" + activity.getProjectId() 
                            + ", projectName=" + activity.getProjectName()
                            + ", timeSpent=" + activity.getTimeSpent() + "]");
                        return activity;
                    } catch (Exception e) {
                        System.err.println("Error processing activity: " + e.getMessage());
                        e.printStackTrace();
                        throw e;
                    }
                })
                .collect(Collectors.toList());
        // Basic server-side validation: ensure reasonable time range
        activities.forEach(act -> {
            if (act.getTimeSpent() == null || act.getTimeSpent() < 1 || act.getTimeSpent() > 8 * 60 * 60) {
                throw new IllegalArgumentException("Invalid timeSpent");
            }
            if (act.getStartTime() == null || act.getEndTime() == null || act.getEndTime().before(act.getStartTime())) {
                throw new IllegalArgumentException("Invalid time range");
            }
        });

        // Basic server-side validation
        activities.forEach(act -> {
            if (act.getTimeSpent() == null || act.getTimeSpent() < 1 || act.getTimeSpent() > 8 * 60 * 60) {
                throw new IllegalArgumentException("Invalid timeSpent");
            }
            if (act.getStartTime() == null || act.getEndTime() == null || act.getEndTime().before(act.getStartTime())) {
                throw new IllegalArgumentException("Invalid time range");
            }
        });

        // Save and log
        List<Activity> savedActivities = activityRepository.saveAll(activities);
        System.out.println("Saved " + savedActivities.size() + " activities to database");
        savedActivities.forEach(act -> System.out.println("Saved activity: ID=" + act.getId() 
            + ", projectId=" + act.getProjectId() 
            + ", projectName=" + act.getProjectName()));
        return savedActivities;
    }


    public List<Activity> getActivitiesByUserId(String userId) {
        return activityRepository.findByUserId(userId);
    }



    public boolean deleteActivity(String activityId, User user) {
        return activityRepository.findById(activityId)
                .map(activity -> {
                    if (!activity.getUserId().equals(user.getId())) {
                        throw new SecurityException("Access denied");
                    }
                    activityRepository.delete(activity);
                    return true;
                }).orElse(false);
    }


    @Cacheable(value = "projectActivities", key = "#userId + '-' + (#projectId != null ? #projectId : #projectName)")
    public List<Activity> findActivities(String userId, String projectName, String projectId, Date from, Date to) {
        if (projectId != null) {
            if (from != null && to != null) {
                return activityRepository.findByUserIdAndProjectIdAndStartTimeBetween(userId, projectId, from, to);
            }
            return activityRepository.findByUserIdAndProjectId(userId, projectId);
        }
        if (projectName != null && from != null && to != null) {
            return activityRepository.findByUserIdAndProjectNameAndStartTimeBetween(userId, projectName, from, to);
        }
        if (projectName != null) {
            return activityRepository.findByUserIdAndProjectName(userId, projectName);
        }
        if (from != null && to != null) {
            return activityRepository.findByUserIdAndStartTimeBetween(userId, from, to);
        }
        return activityRepository.findByUserId(userId);
    }



    public Page<Activity> findActivitiesPage(String userId, Pageable pageable) {
        return activityRepository.findByUserId(userId, pageable);
    }

    

    public Page<Activity> findActivitiesPage(String userId, String projectName, String projectId, Date from, Date to, Pageable pageable) {
        if (projectId != null) {
            if (from != null && to != null) {
                return activityRepository.findByUserIdAndProjectIdAndStartTimeBetween(userId, projectId, from, to, pageable);
            }
            return activityRepository.findByUserIdAndProjectId(userId, projectId, pageable);
        }
        if (projectName != null && from != null && to != null) {
            return activityRepository.findByUserIdAndProjectNameAndStartTimeBetween(userId, projectName, from, to, pageable);
        }
        if (projectName != null) {
            return activityRepository.findByUserIdAndProjectName(userId, projectName, pageable);
        }
        if (from != null && to != null) {
            return activityRepository.findByUserIdAndStartTimeBetween(userId, from, to, pageable);
        }
        return activityRepository.findByUserId(userId, pageable);
    }
}
