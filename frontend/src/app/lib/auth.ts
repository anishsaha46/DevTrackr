// Centralized authentication token management

export function getAuthToken(): string | null {
    if (typeof window === "undefined") {
        return null;
    }
    return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export function setAuthToken(token: string, rememberMe: boolean = false): void {
    if (typeof window === "undefined") {
        return;
    }
    if (rememberMe) {
        localStorage.setItem("token", token);
        sessionStorage.removeItem("token");
    } else {
        sessionStorage.setItem("token", token);
        localStorage.removeItem("token");
    }
}

export function clearAuthToken(): void {
    if (typeof window === "undefined") {
        return;
    }
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
}