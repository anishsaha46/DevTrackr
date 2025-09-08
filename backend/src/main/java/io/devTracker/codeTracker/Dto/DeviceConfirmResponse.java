package io.devTracker.codeTracker.Dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceConfirmResponse {
    private String accessToken;   // JWT token
    private String refreshToken;  // Optional refresh token
    private UserDTO user;         // User information
    private String deviceId;      // Device identifier
}
