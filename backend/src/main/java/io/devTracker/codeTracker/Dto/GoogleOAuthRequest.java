package io.devTracker.codeTracker.Dto;

public class GoogleOAuthRequest {
    private String code;

    public GoogleOAuthRequest() {}

    public GoogleOAuthRequest(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
