package io.devTracker.codeTracker.Model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "activities")
@CompoundIndexes({
    @CompoundIndex(name = "uniq_user_session_file_start", def = "{ 'userId': 1, 'sessionId': 1, 'file': 1, 'startTime': 1 }", unique = true)
})
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
