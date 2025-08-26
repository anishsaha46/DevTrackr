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
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String email;
    private String password;
    private String provider; // local, google, github
    private String username; // GitHub username
    private String name; // Full name

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;
}
