package io.devTracker.codeTracker.Model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "devices")
public class Device {
    @Id
    private String id;
    private String userId;           // Owner of the device
    private String deviceCode;       // Short-lived device code
    private String deviceName;       // Human-readable device name
    private String deviceType;       // Type of device (vscode-extension, etc.)
    private String deviceId;         // Unique device identifier
    private String status;           // pending, approved, expired
    private Date expiresAt;          // When the device code expires
    private Date lastSeen;           // Last time device was active
    private boolean isActive;        // Whether device is currently active

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;
}
