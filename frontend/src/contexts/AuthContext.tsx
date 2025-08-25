import React, { useState, useEffect, ReactNode } from "react";
import { authService } from "@/services";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(true); // Default to true, will check during load
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Check initialization and auth on load
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const status = await authService.status();
        setIsInitialized(!!status?.initialized);
        if (!status?.initialized) {
          // Not initialized: skip token check
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        // If status fails, assume not initialized
        setIsInitialized(false);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        await authService.checkToken();
        setIsAuthenticated(true);
      } catch (e) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  // Setup token refresh interval
  useEffect(() => {
    if (!isAuthenticated) return;

    // Refresh token every 14 minutes (assuming 15 min expiry)
    const refreshInterval = setInterval(async () => {
      try {
        await authService.refreshToken();
      } catch (error) {
        console.error("Failed to refresh token:", error);
        setIsAuthenticated(false);
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const login = async (password: string) => {
    setIsLoading(true);
    try {
      await authService.login({ masterPassword: password });
      setIsAuthenticated(true);
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: (error as Error).message || "Invalid master password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const initialize = async (password: string) => {
    setIsLoading(true);
    try {
      await authService.initialize({ masterPassword: password });
      setIsInitialized(true);
      setIsAuthenticated(true);
      toast({
        title: "System Initialized",
        description: "Master password has been set successfully",
      });
    } catch (error) {
      toast({
        title: "Initialization Failed",
        description:
          (error as Error).message || "Failed to set master password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const changeMasterPassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    setIsLoading(true);
    try {
      await authService.changeMasterPassword({
        currentPassword,
        newPassword,
      });
      toast({
        title: "Password Changed",
        description: "Your master password has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Password Change Failed",
        description:
          (error as Error).message || "Failed to update master password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isInitialized,
        isLoading,
        login,
        logout,
        initialize,
        changeMasterPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
