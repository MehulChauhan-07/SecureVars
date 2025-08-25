import { apiRequest } from "./api-client";
import { ProjectSummary } from "@/types/secret";

interface Project {
  id: string;
  name: string;
  modules: string[];
  environments: string[];
  secretCount?: number;
}

interface ProjectsResponse {
  projects: Project[];
  results: number;
}

interface ProjectResponse {
  project: Project;
}

interface ProjectSecretsResponse {
  secrets: Array<{
    id: string;
    name: string;
    identifier: string;
    project: {
      name: string;
      module?: string;
      _id: string;
    };
    environment: string;
    meta: {
      description: string;
      tags: string[];
      isActive: boolean;
      isFavorite: boolean;
      createdAt: string;
      lastUpdated: string;
      version: number;
      [key: string]:
        | string
        | number
        | boolean
        | string[]
        | Date
        | undefined
        | null
        | Record<string, unknown>;
    };
  }>;
  results: number;
}

export const projectService = {
  // Get all projects
  getAllProjects: () =>
    apiRequest<ProjectsResponse>({
      method: "GET",
      url: "/projects",
    }),

  // Get a single project by ID
  getProject: (id: string) =>
    apiRequest<ProjectResponse>({
      method: "GET",
      url: `/projects/${id}`,
    }),

  // Create a new project
  createProject: (data: Partial<Project>) =>
    apiRequest<ProjectResponse>({
      method: "POST",
      url: "/projects",
      data,
    }),

  // Update an existing project
  updateProject: (id: string, data: Partial<Project>) =>
    apiRequest<ProjectResponse>({
      method: "PUT",
      url: `/projects/${id}`,
      data,
    }),

  // Delete a project
  deleteProject: (id: string) =>
    apiRequest<null>({
      method: "DELETE",
      url: `/projects/${id}`,
    }),

  // Get all secrets for a specific project
  getProjectSecrets: (id: string) =>
    apiRequest<ProjectSecretsResponse>({
      method: "GET",
      url: `/projects/${id}/secrets`,
    }),
};
