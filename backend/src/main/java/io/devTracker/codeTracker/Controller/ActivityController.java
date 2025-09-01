package io.devTracker.codeTracker.Controller;

import io.devTracker.codeTracker.Service.ActivityService;
import io.devTracker.codeTracker.Model.User;
import  io.devTracker.codeTracker.Dto.ActivityDTO;
import io.devTracker.codeTracker.Model.Activity;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/activity")
public class ActivityController {
    @Autowired
    private ActivityService activityService;

/**
     * Helper method to convert Activity model to ActivityResponse DTO.
     */
    private ActivityDTO.ActivityResponse convertToResponse(Activity activity) {
        return new ActivityDTO.ActivityResponse(
                activity.getId(),
                activity.getUserId(),
                activity.getProjectName(),
                activity.getLanguage(),
                activity.getStartTime().toInstant(),
                activity.getEndTime().toInstant(),
                activity.getCreatedAt().toInstant(),
                activity.getUpdatedAt().toInstant(),
                activity.getFile(),
                activity.getTimeSpent(),
                activity.getSessionId(),
                activity.getFileExtension()
        );
    }

    /**
     * Submit a bulk of activities using a wrapper request object.
     * Accepts activities in request body and authenticated user.
     * Returns list of saved activity responses.
     */
    @PostMapping("/bulk")
    public ResponseEntity<List<ActivityDTO.ActivityResponse>> submitActivities(
            @RequestBody ActivityDTO.SubmitActivitiesRequest req,
            @AuthenticationPrincipal User user) {
        
        // Save the submitted activities for the authenticated user
        List<Activity> savedActivities = activityService.submitActivities(req.activities(), user);

        // Convert model to DTO for response
        List<ActivityDTO.ActivityResponse> responses = savedActivities.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return new ResponseEntity<>(responses, HttpStatus.CREATED);
    }

    /**
     * Submit a batch of activities using a list of activity requests.
     */
    @PostMapping("/batch")
    public ResponseEntity<List<ActivityDTO.ActivityResponse>> submitBatchActivities(
            @RequestBody List<ActivityDTO.ActivityRequest> activities,
            @AuthenticationPrincipal User user) {
        
        List<Activity> savedActivities = activityService.submitBatchActivities(activities, user);
        List<ActivityDTO.ActivityResponse> responses = savedActivities.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return new ResponseEntity<>(responses, HttpStatus.CREATED);
    }
    
    
}
