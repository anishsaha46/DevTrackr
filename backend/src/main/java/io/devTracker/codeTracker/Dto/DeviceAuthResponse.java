package io.devTracker.codeTracker.Dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceAuthResponse {
    private String deviceCode;        // Short-lived device code
    private String verificationUrl;   // URL for user to visit
    private int expiresIn;           // Expiration time in seconds
    private int interval;            // Polling interval in seconds
    private String userCode;         // User-friendly code to display
}
