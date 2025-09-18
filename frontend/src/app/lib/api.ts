// import { headers } from "next/headers";

// Login a user
export async function login(email: string, password: string) {
  try {
    const res = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    
    if (!res.ok) {
      if (res.status === 0) {
        throw new Error("Cannot connect to server. Please check if your backend is running on http://localhost:8080");
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `Login failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error("Network error: Cannot connect to server. Please check if your backend is running.");
    }
    throw err;
  }
}


// Register a new user
export async function register(email: string, password: string) {
  try {
    const res = await fetch("http://localhost:8080/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    
    if (!res.ok) {
      if (res.status === 0) {
        throw new Error("Cannot connect to server. Please check if your backend is running on http://localhost:8080");
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `Registration failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error("Network error: Cannot connect to server. Please check if your backend is running.");
    }
    throw err;
  }
}

// Helper function to get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

// Handle GitHub OAuth callback
export async function handleGitHubCallback(code: string) {
  try {
    const res = await fetch("http://localhost:8080/api/auth/github/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    
    if (!res.ok) {
      if (res.status === 0) {
        throw new Error("Cannot connect to server. Please check if your backend is running on http://localhost:8080");
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `GitHub authentication failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error("Network error: Cannot connect to server. Please check if your backend is running.");
    }
    throw err;
  }
}


// Handle Google OAuth callback
export async function handleGoogleCallback(code: string) {
  try {
    const res = await fetch("http://localhost:8080/api/auth/google/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    
    if (!res.ok) {
      if (res.status === 0) {
        throw new Error("Cannot connect to server. Please check if your backend is running on http://localhost:8080");
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `Google authentication failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error("Network error: Cannot connect to server. Please check if your backend is running.");
    }
    throw err;
  }
}

// Get current user data
export async function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.log("No token found in localStorage");
    return null;
  }
  
  try {
    console.log("Fetching user data with token:", token.substring(0, 20) + "...");
    const res = await fetch("http://localhost:8080/api/auth/me", {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Important for cookies if using them
    });
    
    console.log("Auth response status:", res.status);
    
    if (!res.ok) {
      if (res.status === 401) {
        console.log("Token invalid or expired, removing from storage");
        localStorage.removeItem("token");
      }
      const error = await res.text();
      console.error("Auth error:", error);
      return null;
    }
    
    const userData = await res.json();
    console.log("User data received:", userData);
    return userData;
  } catch (err) {
    console.error("Error fetching user data:", err);
    return null;
  }
}

// Get user's projects
export async function getUserProjects() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");
  
  try {
    const res = await fetch("http://localhost:8080/api/projects", {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
      throw new Error(`Failed to get projects: ${res.status} ${res.statusText}`);
    }
    
    return res.json();
  } catch (err) {
    console.error("Error fetching projects:", err);
    throw err;
  }
}


// Get user's activities
export async function getUserActivities() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");
  
  try {
    const res = await fetch("http://localhost:8080/api/activities", {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
      throw new Error(`Failed to get activities: ${res.status} ${res.statusText}`);
    }
    
    return res.json();
  } catch (err) {
    console.error("Error fetching activities:", err);
    throw err;
  }
}


// Get activity summary
export async function getActivitySummary(period = "week") {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");
  
  try {
    const res = await fetch(`http://localhost:8080/api/reports/summary?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
      throw new Error(`Failed to get activity summary: ${res.status} ${res.statusText}`);
    }
    
    return res.json();
  } catch (err) {
    console.error("Error fetching activity summary:", err);
    throw err;
  }
}


// Get activity heatmap
export async function getActivityHeatmap(year = new Date().getFullYear()) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");
  
  try {
    const res = await fetch(`http://localhost:8080/api/reports/heatmap?year=${year}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
      throw new Error(`Failed to get activity heatmap: ${res.status} ${res.statusText}`);
    }
    
    return res.json();
  } catch (err) {
    console.error("Error fetching activity heatmap:", err);
    throw err;
  }
}


// Get activity timeline
export async function getActivityTimeline(page = 0, size = 20) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");
  
  try {
    const res = await fetch(`http://localhost:8080/api/reports/timeline?page=${page}&size=${size}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
      throw new Error(`Failed to get activity timeline: ${res.status} ${res.statusText}`);
    }
    
    return res.json();
  } catch (err) {
    console.error("Error fetching activity timeline:", err);
    throw err;
  }
}