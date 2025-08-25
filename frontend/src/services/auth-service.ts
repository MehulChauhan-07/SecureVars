import { apiRequest } from "./api-client";
import { Secret, Environment } from "@/types/secret";

interface AuthResponse {
  token?: string;
  message?: string;
}

interface MasterPasswordData {
  masterPassword: string;
}

interface ChangeMasterPasswordData {
  currentPassword: string;
  newPassword: string;
}

export const authService = {
  // Public: get initialization status
  status: () =>
    apiRequest<{ initialized: boolean }>({
      method: "GET",
      url: "/auth/status",
    }),
  // Initialize the master password (first-time setup)
  initialize: (data: MasterPasswordData) =>
    apiRequest<AuthResponse>({
      method: "POST",
      url: "/auth/initialize",
      data,
    }),

  // Login with master password
  login: (data: MasterPasswordData) =>
    apiRequest<AuthResponse>({
      method: "POST",
      url: "/auth/login",
      data,
    }),

  // Refresh the access token using refresh token
  refreshToken: () =>
    apiRequest<AuthResponse>({
      method: "POST",
      url: "/auth/refresh",
    }),

  // Logout (invalidate tokens)
  logout: () =>
    apiRequest<{ message: string }>({
      method: "POST",
      url: "/auth/logout",
    }),

  // Check if current token is valid (200 => valid; 401 => invalid)
  checkToken: () =>
    apiRequest<{ user: unknown }>({
      method: "GET",
      url: "/auth/check",
    }),

  // Change the master password
  changeMasterPassword: (data: ChangeMasterPasswordData) =>
    apiRequest<{ message: string }>({
      method: "POST",
      url: "/auth/change-password",
      data,
    }),
};
