package io.devTracker.codeTracker.Controller;

import io.devTracker.codeTracker.Dto.DeviceAuthRequest;
import io.devTracker.codeTracker.Dto.DeviceAuthResponse;
import io.devTracker.codeTracker.Dto.DeviceConfirmRequest;
import io.devTracker.codeTracker.Dto.DeviceConfirmResponse;
import io.devTracker.codeTracker.Model.Device;
import io.devTracker.codeTracker.Model.User;
import io.devTracker.codeTracker.Service.DeviceAuthService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/device")
@CrossOrigin(origins = "http://localhost:3000")
public class DeviceAuthController {
    
    @Autowired
    private DeviceAuthService deviceAuthService;

    /**
     * Endpoint for the frontend to check if a user has any active devices.
     */
    @GetMapping("/status/has-devices")
    public ResponseEntity<Map<String, Boolean>> hasActiveDevices(@AuthenticationPrincipal User user) {
        if (user == null) {
            // If there's no user, they definitely don't have devices connected.
            return ResponseEntity.ok(Map.of("hasDevices", false));
        }
        boolean hasDevices = deviceAuthService.hasActiveDevices(user.getId());
        return ResponseEntity.ok(Map.of("hasDevices", hasDevices));
    }
    
    /**
     * Initiate device authorization flow
     * POST /api/auth/device
     */
    @PostMapping
    public ResponseEntity<DeviceAuthResponse> initiateDeviceAuth(@RequestBody DeviceAuthRequest request) {
        try {
            DeviceAuthResponse response = deviceAuthService.initiateDeviceAuth(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(null);
        }
    }
    
    @PostMapping("/token")
    public ResponseEntity<?> devicePollForToken(@RequestBody DeviceConfirmRequest request) {
    try {
        DeviceConfirmResponse response = deviceAuthService.devicePollForToken(request.getDeviceCode());
        if (response == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Device code not found or expired"));
        }
        if (response.getAccessToken() == null) {
            // Not yet approved
            return ResponseEntity.status(HttpStatus.ACCEPTED)
                    .body(Map.of("status", "pending"));
        }
        // Approved: Return JWT token
        return ResponseEntity.ok(Map.of("accessToken", response.getAccessToken()));
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
    }
}



    /**
     * Confirm device authorization (called by web app after user login)
     * POST /api/auth/device/confirm
     */
    @PostMapping("/confirm")
    public ResponseEntity<?> confirmDeviceAuth(
            @RequestBody DeviceConfirmRequest request,
            @AuthenticationPrincipal User user) {
        try {
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User must be logged in to confirm device"));
            }
            
            DeviceConfirmResponse response = deviceAuthService.confirmDeviceAuth(request, user);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }


    
    /**
     * Get device status for polling
     * GET /api/auth/device/status/{deviceCode}
     */
    @GetMapping("/status/{deviceCode}")
    public ResponseEntity<Map<String, String>> getDeviceStatus(@PathVariable String deviceCode) {
        try {
            String status = deviceAuthService.getDeviceStatus(deviceCode);
            return ResponseEntity.ok(Map.of("status", status));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get user's connected devices
     * GET /api/auth/device/devices
     */
    @GetMapping("/devices")
    public ResponseEntity<List<Device>> getUserDevices(@AuthenticationPrincipal User user) {
        try {
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
            }
            
            List<Device> devices = deviceAuthService.getUserDevices(user.getId());
            return ResponseEntity.ok(devices);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    /**
     * Revoke a device
     * DELETE /api/auth/device/{deviceId}
     */
    @DeleteMapping("/{deviceId}")
    public ResponseEntity<?> revokeDevice(
            @PathVariable String deviceId,
            @AuthenticationPrincipal User user) {
        try {
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User must be logged in"));
            }
            
            boolean success = deviceAuthService.revokeDevice(deviceId, user.getId());
            if (success) {
                return ResponseEntity.ok(Map.of("message", "Device revoked successfully"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Device not found or access denied"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Cleanup expired devices (can be called periodically)
     * POST /api/auth/device/cleanup
     */
    @PostMapping("/cleanup")
    public ResponseEntity<Map<String, String>> cleanupExpiredDevices() {
        try {
            deviceAuthService.cleanupExpiredDevices();
            return ResponseEntity.ok(Map.of("message", "Expired devices cleaned up"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
