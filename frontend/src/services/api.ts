import { User, UserActivity, CreateUserDTO } from '@/types';

const API_URL = 'http://localhost:8000/api';

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'An error occurred');
  }
  return response.json();
};

// Auth API calls
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },

  register: async (name: string, email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },

  getProfile: async (token: string) => {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },

  logout: async (token: string) => {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },
};

// User API calls
export const userApi = {
  getAll: async (token: string) => {
    const response = await fetch(`${API_URL}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },

  getById: async (id: string, token: string) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },

  create: async (userData: CreateUserDTO, token: string) => {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },

  update: async (id: string, userData: Partial<User>, token: string) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },

  delete: async (id: string, token: string) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },
};

// User Activity API calls
export const activityApi = {
  getAll: async (token: string) => {
    const response = await fetch(`${API_URL}/user-activity`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },

  getByUserId: async (userId: string, token: string) => {
    const response = await fetch(`${API_URL}/user-activity/user/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },

  create: async (activity: { userId: string; action: string }, token: string) => {
    const response = await fetch(`${API_URL}/user-activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: activity.userId,
        action: activity.action
      }),
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },
};

// Profile API calls
export const profileApi = {
  updateProfile: async (profileData: any, token: string) => {
    const response = await fetch(`${API_URL}/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },

  updateSecurity: async (securityData: any, token: string) => {
    const response = await fetch(`${API_URL}/profile/security`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(securityData),
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },

  getSessions: async (token: string) => {
    const response = await fetch(`${API_URL}/profile/sessions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },

  revokeSession: async (sessionId: string, token: string) => {
    const response = await fetch(`${API_URL}/profile/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },

  submitFeedback: async (message: string, token: string) => {
    const response = await fetch(`${API_URL}/profile/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },
};

// Scraping API calls
export const scrapingApi = {
  getSelectors: async (token: string) => {
    const response = await fetch(`${API_URL}/scraping/selectors`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },

  getTables: async (token: string) => {
    const response = await fetch(`${API_URL}/scraping/tables`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },

  proxyUrl: async (url: string, token: string) => {
    const response = await fetch(`${API_URL}/scraping/proxy?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include', // Important for cookie-based auth
    });
    return handleResponse(response);
  },
};

export const logUserActivity = async (userId: string, action: string, token: string) => {
  try {
    return await activityApi.create({ userId, action }, token);
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
};
