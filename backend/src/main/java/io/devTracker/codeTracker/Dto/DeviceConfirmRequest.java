package io.devTracker.codeTracker.Dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceConfirmRequest {
    private String deviceCode;    // Device code to confirm
}
