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
}
