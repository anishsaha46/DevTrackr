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