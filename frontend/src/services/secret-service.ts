import { apiRequest } from "./api-client";
import { Secret } from "@/types/secret";

interface SecretsList {
  secrets: Secret[];
  results: number;
}

interface SecretResponse {
  secret: Secret;
}

interface SecretIdResponse {
  id: string;
}

interface SecretHistoryResponse {
  secret: {
    id: string;
    name: string;
    identifier: string;
  };
  history: Array<{
    id: string;
    secretId: string;
    version: number;
    changedAt: string;
    changeDescription?: string;
  }>;
}

interface RollbackResponse {
  message: string;
  newVersion: number;
}

interface StatusToggleResponse {
  isActive: boolean;
}

interface FavoriteToggleResponse {
  isFavorite: boolean;
}

export const secretService = {
  // Get all secrets with optional filters
  getAllSecrets: (filters?: Record<string, string>) =>
    apiRequest<SecretsList>({
      method: "GET",
      url: "/secrets",
      params: filters,
    }),

  // Get a single secret by ID
  getSecret: (id: string) =>
    apiRequest<SecretResponse>({
      method: "GET",
      url: `/secrets/${id}`,
    }),

  // Create a new secret
  createSecret: (data: Partial<Secret>) =>
    apiRequest<SecretResponse>({
      method: "POST",
      url: "/secrets",
      data,
    }),

  // Update an existing secret
  updateSecret: (id: string, data: Partial<Secret>) =>
    apiRequest<SecretResponse>({
      method: "PUT",
      url: `/secrets/${id}`,
      data,
    }),

  // Delete a secret
  deleteSecret: (id: string) =>
    apiRequest<null>({
      method: "DELETE",
      url: `/secrets/${id}`,
    }),

  // Delete multiple secrets
  deleteSecrets: (ids: string[]) =>
    apiRequest<{ message: string }>({
      method: "POST",
      url: "/secrets/bulk-delete",
      data: { ids },
    }),

  // Toggle secret active status
  toggleSecretStatus: (id: string) =>
    apiRequest<StatusToggleResponse>({
      method: "PATCH",
      url: `/secrets/${id}/toggle-status`,
    }),

  // Toggle secret favorite status
  toggleFavorite: (id: string) =>
    apiRequest<FavoriteToggleResponse>({
      method: "PATCH",
      url: `/secrets/${id}/toggle-favorite`,
    }),

  // Get secret history
  getSecretHistory: (id: string) =>
    apiRequest<SecretHistoryResponse>({
      method: "GET",
      url: `/secrets/${id}/history`,
    }),

  // Rollback a secret to a previous version
  rollbackSecret: (id: string, version: number) =>
    apiRequest<RollbackResponse>({
      method: "POST",
      url: `/secrets/${id}/rollback`,
      data: { version },
    }),

  // Get recently accessed secrets
  getRecentlyAccessed: (limit: number = 5) =>
    apiRequest<SecretsList>({
      method: "GET",
      url: "/secrets/recent",
      params: { limit },
    }),
};
