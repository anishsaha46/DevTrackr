package io.devTracker.codeTracker.Dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceAuthRequest {
    private String deviceName;    // e.g., "VS Code - MacBook Pro"
    private String deviceType;    // e.g., "vscode-extension"
    private String deviceId;      // unique device identifier
}
