package io.devTracker.codeTracker.Dto;

public class GitHubOAuthRequest {
    String code;

    public GitHubOAuthRequest(){}

    public GitHubOAuthRequest(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
    
}
