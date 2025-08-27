package io.devTracker.codeTracker.Dto;

public class GitHubOAuthResponse {
    private String token;
    private String githubToken;
    private UserDTO user;

    public GitHubOAuthResponse() {}

    public GitHubOAuthResponse(String token, String githubToken, UserDTO user) {
        this.token = token;
        this.githubToken = githubToken;
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getGitHubToken() {
        return githubToken;
    }

    public void setGitHubToken(String githubToken) {
        this.githubToken = githubToken;
    }

    public UserDTO getUser() {
        return user;
    }

    public void setUser(UserDTO user) {
        this.user = user;
    }
}
