export interface SecretHistory {
  id: string;
  secretId: string;
  version: number;
  value: string;
  changedAt: Date;
  changeDescription?: string;
}

export interface Secret {
  id: string;
  name: string;
  identifier: string;
  value: string;
  project: {
    name: string;
    module?: string;
  };
  environment: "development" | "production" | "testing" | "staging";
  meta: {
    description: string;
    tags: string[];
    createdAt: Date;
    lastUpdated: Date;
    isActive: boolean;
    isFavorite?: boolean;
    lastAccessed?: Date;
    accessCount?: number;
    version?: number;
  };
  history?: SecretHistory[];
}
// PATCH: extend SecretsContextType with new fields.

export interface SecretsContextType {
  secrets: Secret[];
  selectedSecrets: string[];
  recentlyAccessed: Secret[];
  allTags: string[]; // NEW
  addSecret: (
    secret: Omit<Secret, "id" | "meta"> & {
      meta: Omit<Secret["meta"], "createdAt" | "lastUpdated">;
    }
  ) => void;
  updateSecret: (id: string, secret: Partial<Secret>) => void;
  deleteSecret: (id: string) => void;
  deleteSecrets: (ids: string[]) => void;
  toggleSecretStatus: (id: string) => void;
  toggleFavorite: (id: string) => void;
  accessSecret: (id: string) => void;
  setSelectedSecrets: (ids: string[]) => void;
  toggleSelectedSecret: (id: string) => void;
  clearSelectedSecrets: () => void;
  rollbackSecret: (id: string, version: number) => void;
  importFromEnv: (
    content: string,
    project?: string,
    environment?: string
  ) => Promise<number>;
  importFromJson: (data: Secret[]) => Promise<number>;
  exportToEnv: (secretIds?: string[], environment?: string) => string;
  exportToJson: (secretIds?: string[]) => Secret[];
  exportToCsv: (secretIds?: string[]) => string;
  checkDuplicateIdentifier: (identifier: string, excludeId?: string) => boolean;
  updateSecretTags: (id: string, tags: string[]) => void; // NEW
}

export type Environment = "development" | "production" | "testing" | "staging";

export interface ProjectSummary {
  name: string;
  secretCount: number;
  environments: Environment[];
}

export interface ExportFormat {
  format: "env" | "json" | "csv";
  filename: string;
  content: string;
}

export interface ImportResult {
  success: number;
  errors: string[];
  duplicates: string[];
}
