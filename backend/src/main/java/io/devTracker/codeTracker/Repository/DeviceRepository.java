package io.devTracker.codeTracker.Repository;

import io.devTracker.codeTracker.Model.Device;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceRepository extends MongoRepository<Device, String> {
    
    // Find device by device code
    Optional<Device> findByDeviceCode(String deviceCode);
    
    // Find devices by user ID
    List<Device> findByUserId(String userId);
    
    // Find active devices by user ID
    List<Device> findByUserIdAndIsActiveTrue(String userId);
    
    // Find expired devices
    List<Device> findByExpiresAtBefore(Date date);
    
    // Find pending devices
    List<Device> findByStatusAndExpiresAtAfter(String status, Date date);
    
    // Delete expired devices
    void deleteByExpiresAtBefore(Date date);
}
