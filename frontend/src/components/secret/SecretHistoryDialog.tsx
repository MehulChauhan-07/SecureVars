import { useSecrets } from '@/contexts/SecretsContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, RotateCcw, Clock, Eye, EyeOff } from 'lucide-react';
import { Secret } from '@/types/secret';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SecretHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secret: Secret | null;
}

export const SecretHistoryDialog: React.FC<SecretHistoryDialogProps> = ({
  open,
  onOpenChange,
  secret
}) => {
  const { rollbackSecret } = useSecrets();
  const { toast } = useToast();
  const [showValues, setShowValues] = useState(false);

  if (!secret || !secret.history) return null;

  const handleRollback = (version: number) => {
    if (window.confirm(`Are you sure you want to rollback to version ${version}? This will create a new version with the old value.`)) {
      rollbackSecret(secret.id, version);
      toast({
        title: 'Rollback successful',
        description: `Rolled back ${secret.name} to version ${version}.`,
      });
      onOpenChange(false);
    }
  };

  const sortedHistory = [...secret.history].sort((a, b) => b.version - a.version);
  const currentVersion = secret.meta.version || 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Version History - {secret.name}</span>
          </DialogTitle>
          <DialogDescription>
            View and rollback to previous versions of this secret
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                Current Version: {currentVersion}
              </Badge>
              <Badge variant="secondary">
                {sortedHistory.length} version{sortedHistory.length !== 1 ? 's' : ''} total
              </Badge>
            </div>
            
            <Button
              onClick={() => setShowValues(!showValues)}
              variant="outline"
              size="sm"
            >
              {showValues ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Values
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Values
                </>
              )}
            </Button>
          </div>

          <div className="space-y-3">
            {sortedHistory.map((historyEntry) => (
              <Card 
                key={historyEntry.id}
                className={historyEntry.version === currentVersion ? 'border-primary' : ''}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={historyEntry.version === currentVersion ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        Version {historyEntry.version}
                        {historyEntry.version === currentVersion && ' (Current)'}
                      </Badge>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{historyEntry.changedAt.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {historyEntry.version !== currentVersion && (
                      <Button
                        onClick={() => handleRollback(historyEntry.version)}
                        variant="outline"
                        size="sm"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Rollback
                      </Button>
                    )}
                  </div>
                  
                  {historyEntry.changeDescription && (
                    <CardDescription className="text-xs">
                      {historyEntry.changeDescription}
                    </CardDescription>
                  )}
                </CardHeader>
                
                {showValues && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground font-medium">Value:</div>
                      <div className="font-mono text-sm bg-muted p-3 rounded border break-all">
                        {historyEntry.value.length > 200 
                          ? `${historyEntry.value.substring(0, 200)}...` 
                          : historyEntry.value
                        }
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};