package io.devTracker.codeTracker.Service;

import io.devTracker.codeTracker.Dto.DeviceAuthRequest;
import io.devTracker.codeTracker.Dto.DeviceAuthResponse;
import io.devTracker.codeTracker.Dto.DeviceConfirmRequest;
import io.devTracker.codeTracker.Dto.DeviceConfirmResponse;
import io.devTracker.codeTracker.Dto.UserDTO;
import io.devTracker.codeTracker.Model.Device;
import io.devTracker.codeTracker.Model.User;
import io.devTracker.codeTracker.Repository.DeviceRepository;
import io.devTracker.codeTracker.Repository.UserRepository;
import io.devTracker.codeTracker.Security.JwtUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class DeviceAuthService {
    
    @Autowired
    private DeviceRepository deviceRepository;
    
    @Autowired
    private UserRepository UserRepository;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Value("${app.device-auth.expiration:600}") // 10 minutes default
    private int deviceCodeExpirationSeconds;
    
    @Value("${app.device-auth.polling-interval:5}") // 5 seconds default
    private int pollingIntervalSeconds;
    
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;
    
    /**
     * Initiate device authorization flow
     */
    public DeviceAuthResponse initiateDeviceAuth(DeviceAuthRequest request) {
        // Generate unique device code
        String deviceCode = generateDeviceCode();
        String userCode = generateUserCode();
        
        // Create device record
        Device device = Device.builder()
                .deviceCode(deviceCode)
                .deviceName(request.getDeviceName())
                .deviceType(request.getDeviceType())
                .deviceId(request.getDeviceId())
                .status("pending")
                .expiresAt(new Date(System.currentTimeMillis() + (deviceCodeExpirationSeconds * 1000L)))
                .isActive(false)
                .build();
        
        deviceRepository.save(device);
        
        // Build verification URL
        String verificationUrl = String.format("%s/auth/device/confirm?code=%s", 
                frontendUrl, deviceCode);
        
        return DeviceAuthResponse.builder()
                .deviceCode(deviceCode)
                .verificationUrl(verificationUrl)
                .expiresIn(deviceCodeExpirationSeconds)
                .interval(pollingIntervalSeconds)
                .userCode(userCode)
                .build();
    }
    
    /**
     * Confirm device authorization and return JWT token
     */
    public DeviceConfirmResponse confirmDeviceAuth(DeviceConfirmRequest request, User user) {
        Optional<Device> deviceOpt = deviceRepository.findByDeviceCode(request.getDeviceCode());
        
        if (deviceOpt.isEmpty()) {
            throw new RuntimeException("Invalid device code");
        }
        
        Device device = deviceOpt.get();
        
        // Check if device code is expired
        if (device.getExpiresAt().before(new Date())) {
            device.setStatus("expired");
            deviceRepository.save(device);
            throw new RuntimeException("Device code has expired");
        }
        
        // Check if device is already approved
        if (!"pending".equals(device.getStatus())) {
            throw new RuntimeException("Device code is no longer valid");
        }
        
        if (user == null) {
            throw new RuntimeException("No authenticated user found. Please log in to the web app first.");
        }
        
        // Update device status
        Device updatedDevice = Device.builder()
                .id(device.getId())
                .userId(user.getId())
                .deviceCode(device.getDeviceCode())
                .deviceName(device.getDeviceName())
                .deviceType(device.getDeviceType())
                .deviceId(device.getDeviceId())
                .status("approved")
                .expiresAt(device.getExpiresAt())
                .lastSeen(new Date())
                .isActive(true)
                .createdAt(device.getCreatedAt())
                .updatedAt(new Date())
                .build();
        deviceRepository.save(updatedDevice);
        
        // Generate JWT token
        String accessToken = jwtUtil.generateToken(user.getId(), user.getEmail());
        
        return DeviceConfirmResponse.builder()
                .accessToken(accessToken)
                .user(new UserDTO(user))
                .deviceId(device.getDeviceId())
                .build();
    }
    
    /**
     * Get device status for polling
     */
    public String getDeviceStatus(String deviceCode) {
        Optional<Device> deviceOpt = deviceRepository.findByDeviceCode(deviceCode);
        
        if (deviceOpt.isEmpty()) {
            return "not_found";
        }
        
        Device device = deviceOpt.get();
        
        if (device.getExpiresAt().before(new Date())) {
            device.setStatus("expired");
            deviceRepository.save(device);
            return "expired";
        }
        
        return device.getStatus();
    }
    
    /**
     * Clean up expired devices
     */
    public void cleanupExpiredDevices() {
        deviceRepository.deleteByExpiresAtBefore(new Date());
    }
    
    /**
     * Get user's connected devices
     */
    public java.util.List<Device> getUserDevices(String userId) {
        return deviceRepository.findByUserIdAndIsActiveTrue(userId);
    }
    
    /**
     * Revoke a device
     */
    public boolean revokeDevice(String deviceId, String userId) {
        Optional<Device> deviceOpt = deviceRepository.findById(deviceId);
        
        if (deviceOpt.isPresent() && deviceOpt.get().getUserId().equals(userId)) {
            Device device = deviceOpt.get();
            Device updatedDevice = Device.builder()
                    .id(device.getId())
                    .userId(device.getUserId())
                    .deviceCode(device.getDeviceCode())
                    .deviceName(device.getDeviceName())
                    .deviceType(device.getDeviceType())
                    .deviceId(device.getDeviceId())
                    .status("revoked")
                    .expiresAt(device.getExpiresAt())
                    .lastSeen(device.getLastSeen())
                    .isActive(false)
                    .createdAt(device.getCreatedAt())
                    .updatedAt(new Date())
                    .build();
            deviceRepository.save(updatedDevice);
            return true;
        }
        
        return false;
    }
    
    // Helper methods
    private String generateDeviceCode() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    }
    
    private String generateUserCode() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }
    
}
