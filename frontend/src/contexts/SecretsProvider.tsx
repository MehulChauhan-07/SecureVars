import React, { useState, useEffect, useCallback, ReactNode } from "react";
import { Secret, SecretHistory } from "@/types/secret";
import { SecretsContext } from "./secrets-context";
import { secretService, importExportService } from "@/services";
import { collectAllTags } from "@/lib/secretUtils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface SecretsProviderProps {
  children: ReactNode;
}

export const SecretsProvider: React.FC<SecretsProviderProps> = ({
  children,
}) => {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [selectedSecrets, setSelectedSecrets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Derived: recentlyAccessed
  const recentlyAccessed = React.useMemo(() => {
    return secrets
      .filter((s) => s.meta.lastAccessed)
      .sort(
        (a, b) =>
          new Date(b.meta.lastAccessed || 0).getTime() -
          new Date(a.meta.lastAccessed || 0).getTime()
      )
      .slice(0, 5);
  }, [secrets]);

  // Derived: allTags
  const allTags = React.useMemo(() => collectAllTags(secrets), [secrets]);

  // Load secrets when authenticated
  const refreshSecrets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await secretService.getAllSecrets();

      // Convert date strings to Date objects
      const processedSecrets: Secret[] = response.secrets.map((secret) => ({
        ...secret,
        meta: {
          ...secret.meta,
          createdAt: new Date(secret.meta.createdAt),
          lastUpdated: new Date(secret.meta.lastUpdated),
          lastAccessed: secret.meta.lastAccessed
            ? new Date(secret.meta.lastAccessed)
            : undefined,
          rotationReminder: secret.meta.rotationReminder
            ? {
                ...secret.meta.rotationReminder,
                lastRotated: secret.meta.rotationReminder.lastRotated
                  ? new Date(secret.meta.rotationReminder.lastRotated)
                  : undefined,
                nextDue: secret.meta.rotationReminder.nextDue
                  ? new Date(secret.meta.rotationReminder.nextDue)
                  : undefined,
              }
            : undefined,
        },
      }));

      setSecrets(processedSecrets);
      setError(null);
    } catch (err) {
      setError(err as Error);
      toast({
        title: "Error Loading Secrets",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      refreshSecrets();
    } else if (!isAuthLoading && !isAuthenticated) {
      // Not authenticated: ensure we show empty state and no loading spinner
      setSecrets([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, refreshSecrets]);

  // Fetch a single secret with decrypted value
  const fetchSecretValue = useCallback(async (id: string): Promise<string> => {
    try {
      const res = await secretService.getSecret(id);
      const value =
        (res as unknown as { secret?: { value?: string } })?.secret?.value ??
        "";
      setSecrets((prev) =>
        prev.map((s) => (s.id === id ? ({ ...s, value } as Secret) : s))
      );
      return value;
    } catch (err) {
      throw err as Error;
    }
  }, []);

  // Add new secret
  const addSecret = async (
    newSecret: Omit<Secret, "id" | "meta"> & {
      meta: Omit<Secret["meta"], "createdAt" | "lastUpdated">;
    }
  ) => {
    setIsLoading(true);
    try {
      const response = await secretService.createSecret(
        newSecret as unknown as Partial<Secret>
      );
      await refreshSecrets(); // Refresh list after adding
      toast({
        title: "Secret Created",
        description: `${newSecret.name} has been added successfully`,
      });
    } catch (err) {
      toast({
        title: "Failed to Create Secret",
        description: (err as Error).message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update existing secret
  const updateSecret = async (id: string, updatedSecret: Partial<Secret>) => {
    setIsLoading(true);
    try {
      await secretService.updateSecret(id, updatedSecret);
      await refreshSecrets(); // Refresh to get updated list
      toast({
        title: "Secret Updated",
        description: `Secret has been updated successfully`,
      });
    } catch (err) {
      toast({
        title: "Failed to Update Secret",
        description: (err as Error).message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete secret
  const deleteSecret = async (id: string) => {
    setIsLoading(true);
    try {
      await secretService.deleteSecret(id);
      setSelectedSecrets((prev) => prev.filter((secretId) => secretId !== id));
      await refreshSecrets();
      toast({
        title: "Secret Deleted",
        description: "Secret has been deleted successfully",
      });
    } catch (err) {
      toast({
        title: "Failed to Delete Secret",
        description: (err as Error).message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete multiple secrets
  const deleteSecrets = async (ids: string[]) => {
    setIsLoading(true);
    try {
      await secretService.deleteSecrets(ids);
      setSelectedSecrets([]);
      await refreshSecrets();
      toast({
        title: "Secrets Deleted",
        description: `${ids.length} secrets have been deleted successfully`,
      });
    } catch (err) {
      toast({
        title: "Failed to Delete Secrets",
        description: (err as Error).message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle active status
  const toggleSecretStatus = async (id: string) => {
    try {
      await secretService.toggleSecretStatus(id);
      await refreshSecrets();
    } catch (err) {
      toast({
        title: "Status Update Failed",
        description: (err as Error).message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (id: string) => {
    try {
      await secretService.toggleFavorite(id);
      await refreshSecrets();
    } catch (err) {
      toast({
        title: "Favorite Toggle Failed",
        description: (err as Error).message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Access secret (view details)
  const accessSecret = async (id: string) => {
    try {
      await secretService.getSecret(id);
      await refreshSecrets(); // To get updated access stats
    } catch (err) {
      toast({
        title: "Failed to Access Secret",
        description: (err as Error).message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Toggle selection of a secret
  const toggleSelectedSecret = (id: string) => {
    setSelectedSecrets((prev) =>
      prev.includes(id)
        ? prev.filter((secretId) => secretId !== id)
        : [...prev, id]
    );
  };

  // Clear all selected secrets
  const clearSelectedSecrets = () => {
    setSelectedSecrets([]);
  };

  // Rollback to previous version
  const rollbackSecret = async (id: string, version: number) => {
    setIsLoading(true);
    try {
      await secretService.rollbackSecret(id, version);
      await refreshSecrets();
      toast({
        title: "Rollback Successful",
        description: `Secret rolled back to version ${version}`,
      });
    } catch (err) {
      toast({
        title: "Rollback Failed",
        description: (err as Error).message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Import from .env
  const importFromEnv = async (
    content: string,
    project?: string,
    environment?: string
  ): Promise<number> => {
    setIsLoading(true);
    try {
      const result = await importExportService.importFromEnv(
        content,
        project,
        environment
      );
      await refreshSecrets();
      toast({
        title: "Import Successful",
        description: `${result.success} secrets imported successfully`,
      });
      return result.success;
    } catch (err) {
      toast({
        title: "Import Failed",
        description: (err as Error).message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Import from JSON
  const importFromJson = async (data: Secret[]): Promise<number> => {
    setIsLoading(true);
    try {
      const result = await importExportService.importFromJson(data);
      await refreshSecrets();
      toast({
        title: "Import Successful",
        description: `${result.success} secrets imported successfully`,
      });
      return result.success;
    } catch (err) {
      toast({
        title: "Import Failed",
        description: (err as Error).message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Export to .env
  const exportToEnv = async (
    secretIds?: string[],
    environment?: string
  ): Promise<string> => {
    try {
      const result = await importExportService.exportToEnv(
        secretIds,
        environment
      );
      return result.content;
    } catch (err) {
      toast({
        title: "Export Failed",
        description: (err as Error).message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Export to JSON
  const exportToJson = async (secretIds?: string[]): Promise<Secret[]> => {
    try {
      const result = await importExportService.exportToJson(secretIds);
      return result.secrets;
    } catch (err) {
      toast({
        title: "Export Failed",
        description: (err as Error).message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Export to CSV
  const exportToCsv = async (secretIds?: string[]): Promise<string> => {
    try {
      const result = await importExportService.exportToCsv(secretIds);
      return result.content;
    } catch (err) {
      toast({
        title: "Export Failed",
        description: (err as Error).message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Check if identifier is duplicate
  const checkDuplicateIdentifier = async (
    identifier: string,
    excludeId?: string
  ): Promise<boolean> => {
    // This is implemented locally since there's no direct API endpoint
    return secrets.some(
      (secret) => secret.identifier === identifier && secret.id !== excludeId
    );
  };

  // Update tags for a secret
  const updateSecretTags = async (id: string, tags: string[]) => {
    try {
      const secret = secrets.find((s) => s.id === id);
      if (!secret) throw new Error("Secret not found");

      await secretService.updateSecret(id, {
        meta: {
          ...secret.meta,
          tags,
        },
      });

      await refreshSecrets();
    } catch (err) {
      toast({
        title: "Failed to Update Tags",
        description: (err as Error).message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Get secret history
  const getSecretHistory = async (id: string): Promise<SecretHistory[]> => {
    try {
      const response = await secretService.getSecretHistory(id);
      return response.history.map(
        (h: {
          id: string;
          secretId: string;
          version: number;
          changedAt: string | Date;
          changeDescription?: string;
          value?: string;
        }) => ({
          id: h.id,
          secretId: h.secretId,
          version: h.version,
          changedAt: new Date(h.changedAt),
          changeDescription: h.changeDescription,
          value: h.value ?? "",
        })
      );
    } catch (err) {
      toast({
        title: "Failed to Load History",
        description: (err as Error).message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const value = {
    secrets,
    selectedSecrets,
    recentlyAccessed,
    allTags,
    fetchSecretValue,
    isLoading,
    error,
    addSecret,
    updateSecret,
    deleteSecret,
    deleteSecrets,
    toggleSecretStatus,
    toggleFavorite,
    accessSecret,
    setSelectedSecrets,
    toggleSelectedSecret,
    clearSelectedSecrets,
    rollbackSecret,
    importFromEnv,
    importFromJson,
    exportToEnv,
    exportToJson,
    exportToCsv,
    checkDuplicateIdentifier,
    updateSecretTags,
    refreshSecrets,
    getSecretHistory,
  };

  return (
    <SecretsContext.Provider value={value}>{children}</SecretsContext.Provider>
  );
};
