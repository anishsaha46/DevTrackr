package io.devTracker.codeTracker.Service;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
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
                .<Activity>map(a -> Activity.builder()
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
        // Basic server-side validation: ensure reasonable time range and drift
        long now = System.currentTimeMillis();
        long maxDriftMs = 5 * 60 * 1000L; // ±5 minutes
        activities.forEach(act -> {
            if (act.getTimeSpent() == null || act.getTimeSpent() < 1 || act.getTimeSpent() > 8 * 60 * 60) {
                throw new IllegalArgumentException("Invalid timeSpent");
            }
            if (act.getStartTime() == null || act.getEndTime() == null || act.getEndTime().before(act.getStartTime())) {
                throw new IllegalArgumentException("Invalid time range");
            }
            long startMs = act.getStartTime().getTime();
            long endMs = act.getEndTime().getTime();
            if (Math.abs(startMs - now) > maxDriftMs || Math.abs(endMs - now) > maxDriftMs) {
                throw new IllegalArgumentException("Timestamp drift too large");
            }
        });
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



    public Page<Activity> findActivitiesPage(String userId, Pageable pageable) {
        return activityRepository.findByUserId(userId, pageable);
    }

    

    public Page<Activity> findActivitiesPage(String userId, String projectName, Date from, Date to, Pageable pageable) {
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
