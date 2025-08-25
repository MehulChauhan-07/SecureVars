import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// API Base URL: force Vite proxy in dev; allow override in prod via VITE_API_URL
const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_URL || "/api";

// Create an axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Required to send cookies with requests
});

// Request interceptor - useful for authentication
apiClient.interceptors.request.use(
  (config) => {
    // You could add auth headers here if needed, but we're using cookies
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error?: unknown) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(true);
    }
  });
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized) - token expired
    if (error.response?.status === 401) {
      // Do not attempt refresh for auth routes to avoid loops
      const url: string = originalRequest?.url || "";
      if (url.startsWith("/auth/")) {
        return Promise.reject(error);
      }
      if (originalRequest._retry) {
        // Already retried once; fail fast
        return Promise.reject(error);
      }
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: () => resolve(apiClient(originalRequest)),
            reject: (err) => reject(err),
          });
        });
      }

      isRefreshing = true;
      try {
        await refreshAccessToken();
        processQueue();
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to refresh the access token
async function refreshAccessToken() {
  try {
    await apiClient.post("/auth/refresh");
    return true;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    throw error;
  }
}

// Generic request function
export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response: AxiosResponse<{ status: string; data?: T }> =
      await apiClient(config);
    return response.data.data as T;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Extract error message from the backend response
      const errorMessage = error.response.data?.message || error.message;
      throw new Error(errorMessage);
    }
    throw error;
  }
}

export default apiClient;
