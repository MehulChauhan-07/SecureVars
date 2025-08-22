import { useSecrets } from '@/contexts/SecretsContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Download, Power, PowerOff, X } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ImportExportDialog } from './ImportExportDialog';

interface BulkActionsBarProps {
  visible: boolean;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({ visible }) => {
  const { selectedSecrets, clearSelectedSecrets, deleteSecrets, secrets, toggleSecretStatus } = useSecrets();
  const { toast } = useToast();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');

  if (!visible || selectedSecrets.length === 0) return null;

  const selectedSecretsData = secrets.filter(s => selectedSecrets.includes(s.id));

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedSecrets.length} secret(s)?`)) {
      deleteSecrets(selectedSecrets);
      toast({
        title: 'Secrets deleted',
        description: `Successfully deleted ${selectedSecrets.length} secret(s).`,
      });
    }
  };

  const handleBulkStatusChange = (activate: boolean) => {
    selectedSecrets.forEach(id => {
      const secret = secrets.find(s => s.id === id);
      if (secret && secret.meta.isActive !== activate) {
        toggleSecretStatus(id);
      }
    });
    
    toast({
      title: `Secrets ${activate ? 'activated' : 'deactivated'}`,
      description: `Successfully ${activate ? 'activated' : 'deactivated'} ${selectedSecrets.length} secret(s).`,
    });
    clearSelectedSecrets();
  };

  const handleBulkAction = () => {
    switch (bulkAction) {
      case 'activate':
        handleBulkStatusChange(true);
        break;
      case 'deactivate':
        handleBulkStatusChange(false);
        break;
      case 'export':
        setShowExportDialog(true);
        break;
      case 'delete':
        handleBulkDelete();
        break;
    }
    setBulkAction('');
  };

  return (
    <>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground rounded-lg shadow-lg p-4 z-50 flex items-center space-x-4 max-w-4xl w-full mx-4">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-primary-foreground text-primary">
            {selectedSecrets.length} selected
          </Badge>
          <div className="flex flex-wrap gap-1 max-w-md">
            {selectedSecretsData.slice(0, 3).map(secret => (
              <Badge key={secret.id} variant="outline" className="text-xs border-primary-foreground text-primary-foreground">
                {secret.name}
              </Badge>
            ))}
            {selectedSecrets.length > 3 && (
              <Badge variant="outline" className="text-xs border-primary-foreground text-primary-foreground">
                +{selectedSecrets.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-1">
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="w-40 bg-primary-foreground text-primary">
              <SelectValue placeholder="Choose action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activate">
                <div className="flex items-center space-x-2">
                  <Power className="h-4 w-4" />
                  <span>Activate</span>
                </div>
              </SelectItem>
              <SelectItem value="deactivate">
                <div className="flex items-center space-x-2">
                  <PowerOff className="h-4 w-4" />
                  <span>Deactivate</span>
                </div>
              </SelectItem>
              <SelectItem value="export">
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </div>
              </SelectItem>
              <SelectItem value="delete">
                <div className="flex items-center space-x-2">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={handleBulkAction} 
            disabled={!bulkAction}
            variant="secondary"
            size="sm"
          >
            Apply
          </Button>
        </div>

        <Button
          onClick={clearSelectedSecrets}
          variant="ghost"
          size="sm"
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ImportExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        defaultTab="export"
        selectedSecrets={selectedSecrets}
      />
    </>
  );
};