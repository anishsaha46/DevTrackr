package io.devTracker.codeTracker.Repository;

import java.util.Date;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import io.devTracker.codeTracker.Model.Activity;

public interface ActivityRepository extends MongoRepository<Activity, String> {
    
    List<Activity> findByUserId(String userId);

    List<Activity> findByUserIdAndStartTimeAfter(String userId, Date startTime);

    List<Activity> findByUserIdAndStartTimeBetween(String userId, Date start, Date end);

    Page<Activity> findByUserId(String userId, Pageable pageable);

    // New optimized helpers (list)
    List<Activity> findByUserIdAndProjectName(String userId, String projectName);

    List<Activity> findByUserIdAndProjectNameAndStartTimeBetween(String userId, String projectName, Date start, Date end);

    long countByUserIdAndProjectName(String userId, String projectName);

    // New pageable helpers
    Page<Activity> findByUserIdAndProjectName(String userId, String projectName, Pageable pageable);

    Page<Activity> findByUserIdAndStartTimeBetween(String userId, Date start, Date end, Pageable pageable);

    Page<Activity> findByUserIdAndProjectNameAndStartTimeBetween(String userId, String projectName, Date start, Date end, Pageable pageable);
}
