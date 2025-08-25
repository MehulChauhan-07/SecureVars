import { useContext } from "react";
import { SecretsContext } from "@/contexts/secrets-context";

export const useSecrets = () => {
  const context = useContext(SecretsContext);
  if (!context) {
    throw new Error("useSecrets must be used within a SecretsProvider");
  }
  return context;
};
