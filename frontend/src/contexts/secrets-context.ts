import { createContext } from "react";
import { Secret, SecretHistory } from "@/types/secret";

export interface SecretsContextType {
  secrets: Secret[];
  selectedSecrets: string[];
  recentlyAccessed: Secret[];
  allTags: string[];
  fetchSecretValue: (id: string) => Promise<string>;
  isLoading: boolean;
  error: Error | null;
  addSecret: (
    secret: Omit<Secret, "id" | "meta"> & {
      meta: Omit<Secret["meta"], "createdAt" | "lastUpdated">;
    }
  ) => Promise<void>;
  updateSecret: (id: string, secret: Partial<Secret>) => Promise<void>;
  deleteSecret: (id: string) => Promise<void>;
  deleteSecrets: (ids: string[]) => Promise<void>;
  toggleSecretStatus: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  accessSecret: (id: string) => Promise<void>;
  setSelectedSecrets: (ids: string[]) => void;
  toggleSelectedSecret: (id: string) => void;
  clearSelectedSecrets: () => void;
  rollbackSecret: (id: string, version: number) => Promise<void>;
  importFromEnv: (
    content: string,
    project?: string,
    environment?: string
  ) => Promise<number>;
  importFromJson: (data: Secret[]) => Promise<number>;
  exportToEnv: (secretIds?: string[], environment?: string) => Promise<string>;
  exportToJson: (secretIds?: string[]) => Promise<Secret[]>;
  exportToCsv: (secretIds?: string[]) => Promise<string>;
  checkDuplicateIdentifier: (
    identifier: string,
    excludeId?: string
  ) => Promise<boolean>;
  updateSecretTags: (id: string, tags: string[]) => Promise<void>;
  refreshSecrets: () => Promise<void>;
  getSecretHistory: (id: string) => Promise<SecretHistory[]>;
}

export const SecretsContext = createContext<SecretsContextType | undefined>(
  undefined
);
