import { apiRequest } from "./api-client";
import { Secret, ImportResult, ExportFormat } from "@/types/secret";

interface ImportResponse {
  success: number;
  errors?: string[];
}

interface ExportEnvResponse {
  content: string;
  filename: string;
}

interface ExportJsonResponse {
  secrets: Secret[];
  filename: string;
}

interface ExportCsvResponse {
  content: string;
  filename: string;
}

export const importExportService = {
  // Import secrets from .env file
  importFromEnv: (content: string, project?: string, environment?: string) =>
    apiRequest<ImportResponse>({
      method: "POST",
      url: "/import-export/env",
      data: { content, project, environment },
    }),

  // Export secrets as .env file
  exportToEnv: (secretIds?: string[], environment?: string) =>
    apiRequest<ExportEnvResponse>({
      method: "GET",
      url: "/import-export/env",
      params: { secretIds: secretIds?.join(","), environment },
    }),

  // Import secrets from JSON
  importFromJson: (data: Secret[]) =>
    apiRequest<ImportResponse>({
      method: "POST",
      url: "/import-export/json",
      data: { secrets: data },
    }),

  // Export secrets as JSON
  exportToJson: (secretIds?: string[]) =>
    apiRequest<ExportJsonResponse>({
      method: "GET",
      url: "/import-export/json",
      params: { secretIds: secretIds?.join(",") },
    }),

  // Export secrets as CSV
  exportToCsv: (secretIds?: string[]) =>
    apiRequest<ExportCsvResponse>({
      method: "GET",
      url: "/import-export/csv",
      params: { secretIds: secretIds?.join(",") },
    }),
};
