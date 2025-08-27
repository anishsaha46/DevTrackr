package io.devTracker.codeTracker.Service;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import io.devTracker.codeTracker.Dto.ActivityDTO;
import io.devTracker.codeTracker.Model.User;
import io.devTracker.codeTracker.Model.Activity;
import io.devTracker.codeTracker.Repository.ActivityRepository;


@Service
public class ActivityService {
    @Autowired
    private ActivityRepository activityRepository;

    public List<Activity> submitActivities(List<ActivityDTO.ActivityRequest> activityRequests, User user) {
        List<Activity> activities = activityRequests.stream()
                .map(a -> Activity.builder()
                        .userId(user.getId())
                        .projectName(a.projectName())
                        .build())
                .collect(Collectors.toList());
        return activityRepository.saveAll(activities);
    }

    public List<Activity> submitBatchActivities(List<ActivityDTO.ActivityRequest> activityRequests, User user) {
        List<Activity> activities = activityRequests.stream()
                .map(a -> Activity.builder()
                        .userId(user.getId())
                        .projectName(a.projectName())
                        .language(a.language())
                        .startTime(java.sql.Timestamp.from(a.startTime()))
                        .endTime(java.sql.Timestamp.from(a.endTime()))
                        .file(a.file())
                        .timeSpent(a.timeSpent())
                        .sessionId(a.sessionId())
                        .fileExtension(a.fileExtension())
                        .build())
                .collect(Collectors.toList());
        return activityRepository.saveAll(activities);
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

    public List<Activity> findActivities(String userId, String projectName, Date from, Date to) {
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
}
