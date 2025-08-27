package io.devTracker.codeTracker.Dto;

public class GoogleOAuthResponse {
    private String token;
    private String googleToken;
    private UserDTO user;

    public GoogleOAuthResponse() {}

    public GoogleOAuthResponse(String token, String googleToken, UserDTO user) {
        this.token = token;
        this.googleToken = googleToken;
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getGoogleToken() {
        return googleToken;
    }

    public void setGoogleToken(String googleToken) {
        this.googleToken = googleToken;
    }

    public UserDTO getUser() {
        return user;
    }

    public void setUser(UserDTO user) {
        this.user = user;
    }
}
