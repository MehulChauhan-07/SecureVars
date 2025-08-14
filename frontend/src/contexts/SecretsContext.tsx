import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Secret, SecretsContextType, SecretHistory } from '@/types/secret';
import { generateMockSecrets } from '@/data/mockSecrets';

const SecretsContext = createContext<SecretsContextType | undefined>(undefined);

export const useSecrets = () => {
  const context = useContext(SecretsContext);
  if (!context) {
    throw new Error('useSecrets must be used within a SecretsProvider');
  }
  return context;
};

interface SecretsProviderProps {
  children: ReactNode;
}

export const SecretsProvider: React.FC<SecretsProviderProps> = ({ children }) => {
  const [secrets, setSecrets] = useState<Secret[]>(generateMockSecrets());
  const [selectedSecrets, setSelectedSecrets] = useState<string[]>([]);
  
  const recentlyAccessed = useMemo(() => {
    return secrets
      .filter(s => s.meta.lastAccessed)
      .sort((a, b) => (b.meta.lastAccessed?.getTime() || 0) - (a.meta.lastAccessed?.getTime() || 0))
      .slice(0, 5);
  }, [secrets]);

  const addSecret = (newSecret: Omit<Secret, 'id' | 'meta'> & { meta: Omit<Secret['meta'], 'createdAt' | 'lastUpdated'> }) => {
    const secret: Secret = {
      ...newSecret,
      id: crypto.randomUUID(),
      meta: {
        ...newSecret.meta,
        createdAt: new Date(),
        lastUpdated: new Date(),
        isFavorite: false,
        accessCount: 0,
        version: 1,
      },
      history: [{
        id: crypto.randomUUID(),
        secretId: '',
        version: 1,
        value: newSecret.value,
        changedAt: new Date(),
        changeDescription: 'Initial creation'
      }]
    };
    secret.history![0].secretId = secret.id;
    setSecrets(prev => [secret, ...prev]);
  };

  const updateSecret = (id: string, updatedSecret: Partial<Secret>) => {
    setSecrets(prev => 
      prev.map(secret => {
        if (secret.id === id) {
          const newVersion = (secret.meta.version || 1) + 1;
          const hasValueChanged = updatedSecret.value && updatedSecret.value !== secret.value;
          
          let newHistory = secret.history || [];
          if (hasValueChanged) {
            newHistory = [...newHistory, {
              id: crypto.randomUUID(),
              secretId: id,
              version: newVersion,
              value: updatedSecret.value!,
              changedAt: new Date(),
              changeDescription: 'Value updated'
            }];
          }
          
          return {
            ...secret,
            ...updatedSecret,
            meta: {
              ...secret.meta,
              ...updatedSecret.meta,
              lastUpdated: new Date(),
              version: hasValueChanged ? newVersion : secret.meta.version,
            },
            history: newHistory
          };
        }
        return secret;
      })
    );
  };

  const deleteSecret = (id: string) => {
    setSecrets(prev => prev.filter(secret => secret.id !== id));
    setSelectedSecrets(prev => prev.filter(secretId => secretId !== id));
  };

  const deleteSecrets = (ids: string[]) => {
    setSecrets(prev => prev.filter(secret => !ids.includes(secret.id)));
    setSelectedSecrets([]);
  };

  const toggleSecretStatus = (id: string) => {
    setSecrets(prev => 
      prev.map(secret => 
        secret.id === id 
          ? { 
              ...secret, 
              meta: { 
                ...secret.meta, 
                isActive: !secret.meta.isActive,
                lastUpdated: new Date(),
              }
            }
          : secret
      )
    );
  };

  const toggleFavorite = (id: string) => {
    setSecrets(prev => 
      prev.map(secret => 
        secret.id === id 
          ? { 
              ...secret, 
              meta: { 
                ...secret.meta, 
                isFavorite: !secret.meta.isFavorite,
                lastUpdated: new Date(),
              }
            }
          : secret
      )
    );
  };

  const accessSecret = (id: string) => {
    setSecrets(prev => 
      prev.map(secret => 
        secret.id === id 
          ? { 
              ...secret, 
              meta: { 
                ...secret.meta, 
                lastAccessed: new Date(),
                accessCount: (secret.meta.accessCount || 0) + 1,
              }
            }
          : secret
      )
    );
  };

  const toggleSelectedSecret = (id: string) => {
    setSelectedSecrets(prev => 
      prev.includes(id) 
        ? prev.filter(secretId => secretId !== id)
        : [...prev, id]
    );
  };

  const clearSelectedSecrets = () => {
    setSelectedSecrets([]);
  };

  const rollbackSecret = (id: string, version: number) => {
    setSecrets(prev => 
      prev.map(secret => {
        if (secret.id === id && secret.history) {
          const historyEntry = secret.history.find(h => h.version === version);
          if (historyEntry) {
            const newVersion = (secret.meta.version || 1) + 1;
            const newHistory = [...secret.history, {
              id: crypto.randomUUID(),
              secretId: id,
              version: newVersion,
              value: historyEntry.value,
              changedAt: new Date(),
              changeDescription: `Rolled back to version ${version}`
            }];

            return {
              ...secret,
              value: historyEntry.value,
              meta: {
                ...secret.meta,
                lastUpdated: new Date(),
                version: newVersion,
              },
              history: newHistory
            };
          }
        }
        return secret;
      })
    );
  };

  const importFromEnv = async (content: string, project?: string, environment?: string): Promise<number> => {
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    let imported = 0;
    
    for (const line of lines) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (match) {
        const [, identifier, value] = match;
        const cleanValue = value.replace(/^["']|["']$/g, '');
        
        if (!checkDuplicateIdentifier(identifier)) {
          addSecret({
            name: identifier.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
            identifier,
            value: cleanValue,
            project: {
              name: project || 'Imported Project'
            },
            environment: (environment as any) || 'development',
            meta: {
              description: `Imported from .env file`,
              tags: ['imported'],
              isActive: true
            }
          });
          imported++;
        }
      }
    }
    
    return imported;
  };

  const importFromJson = async (data: Secret[]): Promise<number> => {
    let imported = 0;
    
    for (const secret of data) {
      if (!checkDuplicateIdentifier(secret.identifier)) {
        addSecret({
          name: secret.name,
          identifier: secret.identifier,
          value: secret.value,
          project: secret.project,
          environment: secret.environment,
          meta: {
            description: secret.meta.description,
            tags: [...secret.meta.tags, 'imported'],
            isActive: secret.meta.isActive
          }
        });
        imported++;
      }
    }
    
    return imported;
  };

  const exportToEnv = (secretIds?: string[], environment?: string): string => {
    const filteredSecrets = secrets.filter(secret => {
      const matchesIds = !secretIds || secretIds.includes(secret.id);
      const matchesEnv = !environment || secret.environment === environment;
      return matchesIds && matchesEnv && secret.meta.isActive;
    });

    return filteredSecrets
      .map(secret => `${secret.identifier}=${secret.value}`)
      .join('\n');
  };

  const exportToJson = (secretIds?: string[]): Secret[] => {
    return secrets.filter(secret => !secretIds || secretIds.includes(secret.id));
  };

  const exportToCsv = (secretIds?: string[]): string => {
    const filteredSecrets = secrets.filter(secret => !secretIds || secretIds.includes(secret.id));
    
    const headers = ['Name', 'Identifier', 'Value', 'Project', 'Module', 'Environment', 'Description', 'Tags', 'Active', 'Created', 'Updated'];
    const rows = filteredSecrets.map(secret => [
      secret.name,
      secret.identifier,
      secret.value,
      secret.project.name,
      secret.project.module || '',
      secret.environment,
      secret.meta.description,
      secret.meta.tags.join(';'),
      secret.meta.isActive ? 'Yes' : 'No',
      secret.meta.createdAt.toISOString(),
      secret.meta.lastUpdated.toISOString()
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  };

  const checkDuplicateIdentifier = (identifier: string, excludeId?: string): boolean => {
    return secrets.some(secret => 
      secret.identifier === identifier && secret.id !== excludeId
    );
  };

  const value: SecretsContextType = {
    secrets,
    selectedSecrets,
    recentlyAccessed,
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
  };

  return (
    <SecretsContext.Provider value={value}>
      {children}
    </SecretsContext.Provider>
  );
};