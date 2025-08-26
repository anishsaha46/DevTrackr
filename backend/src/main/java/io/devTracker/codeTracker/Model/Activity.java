package io.devTracker.codeTracker.Model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "activities")
public class Activity {
    @Id
    private String id;
    private String userId;
    private String projectName;
    private String language;
    private Date startTime;
    private Date endTime;
    private String file; // File path/name
    private Integer timeSpent; // Time spent in seconds
    private String sessionId; // VS Code session ID
    private String fileExtension; // File extension

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;
}
