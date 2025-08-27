package io.devTracker.codeTracker.Service;

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
    
}
