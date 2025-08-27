package io.devTracker.codeTracker.Dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UserDTO {
    
    private String id;
    private String email;
    private String username;
    private String name;
    private String provider;

    public UserDTO() {}

    
    public UserDTO(String id,String email,String username,String name,String provider){
        this.id=id;
        this.email=email;
        this.username=username;
        this.name=name;
        this.provider=provider;
    }

     // Constructor that accepts a User entity
    public UserDTO(io.devTracker.codeTracker.Model.User user){
        this.id=user.getId();
        this.email=user.getEmail();
        this.username=user.getUsername();
        this.name=user.getName();
        this.provider=user.getProvider();
    }


     // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
        
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
        
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
        
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
        
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

}
