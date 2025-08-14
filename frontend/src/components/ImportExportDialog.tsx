import { useState } from 'react';
import { useSecrets } from '@/contexts/SecretsContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, FileText, FileSpreadsheet, FileCode, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'import' | 'export';
  selectedSecrets?: string[];
}

export const ImportExportDialog: React.FC<ImportExportDialogProps> = ({
  open,
  onOpenChange,
  defaultTab = 'export',
  selectedSecrets = []
}) => {
  const { secrets, importFromEnv, importFromJson, exportToEnv, exportToJson, exportToCsv } = useSecrets();
  const { toast } = useToast();
  
  // Import states
  const [importType, setImportType] = useState<'env' | 'json'>('env');
  const [importContent, setImportContent] = useState('');
  const [importProject, setImportProject] = useState('');
  const [importEnvironment, setImportEnvironment] = useState('development');
  
  // Export states
  const [exportType, setExportType] = useState<'env' | 'json' | 'csv'>('env');
  const [exportEnvironment, setExportEnvironment] = useState<string>('all');
  const [exportResult, setExportResult] = useState('');
  const [copied, setCopied] = useState(false);

  const handleImport = async () => {
    if (!importContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide content to import.',
        variant: 'destructive',
      });
      return;
    }

    try {
      let imported = 0;
      
      if (importType === 'env') {
        imported = await importFromEnv(
          importContent,
          importProject || undefined,
          importEnvironment
        );
      } else {
        const data = JSON.parse(importContent);
        imported = await importFromJson(Array.isArray(data) ? data : [data]);
      }

      toast({
        title: 'Import successful',
        description: `Successfully imported ${imported} secret(s).`,
      });

      setImportContent('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Import failed',
        description: 'Failed to parse or import the provided content.',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    const secretIds = selectedSecrets.length > 0 ? selectedSecrets : undefined;
    let result = '';

    switch (exportType) {
      case 'env':
        result = exportToEnv(secretIds, exportEnvironment !== 'all' ? exportEnvironment : undefined);
        break;
      case 'json':
        result = JSON.stringify(exportToJson(secretIds), null, 2);
        break;
      case 'csv':
        result = exportToCsv(secretIds);
        break;
    }

    setExportResult(result);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied',
        description: 'Export content copied to clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const downloadFile = () => {
    const extension = exportType === 'env' ? 'env' : exportType;
    const filename = `secrets-export.${extension}`;
    const blob = new Blob([exportResult], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Download started',
      description: `Downloading ${filename}...`,
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'env': return <FileCode className="h-4 w-4" />;
      case 'json': return <FileText className="h-4 w-4" />;
      case 'csv': return <FileSpreadsheet className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Import & Export</span>
          </DialogTitle>
          <DialogDescription>
            Import secrets from various formats or export your current secrets
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Import Type</Label>
                <Select value={importType} onValueChange={(value: any) => setImportType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="env">
                      <div className="flex items-center space-x-2">
                        <FileCode className="h-4 w-4" />
                        <span>.env File</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="json">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>JSON</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input
                  value={importProject}
                  onChange={(e) => setImportProject(e.target.value)}
                  placeholder="Optional project name"
                />
              </div>

              <div className="space-y-2">
                <Label>Environment</Label>
                <Select value={importEnvironment} onValueChange={setImportEnvironment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Content to Import</Label>
              <Textarea
                value={importContent}
                onChange={(e) => setImportContent(e.target.value)}
                placeholder={
                  importType === 'env' 
                    ? 'DATABASE_URL=postgresql://...\nAPI_KEY=your-api-key'
                    : '[{"name": "Database URL", "identifier": "DATABASE_URL", ...}]'
                }
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport}>
                Import Secrets
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Export Format</Label>
                <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="env">
                      <div className="flex items-center space-x-2">
                        <FileCode className="h-4 w-4" />
                        <span>.env Format</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="json">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>JSON</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="csv">
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>CSV</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Environment Filter</Label>
                <Select value={exportEnvironment} onValueChange={setExportEnvironment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Environments</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedSecrets.length > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Selected Secrets ({selectedSecrets.length})</p>
                <div className="flex flex-wrap gap-1">
                  {selectedSecrets.slice(0, 5).map((id) => {
                    const secret = secrets.find(s => s.id === id);
                    return secret ? (
                      <Badge key={id} variant="secondary" className="text-xs">
                        {secret.name}
                      </Badge>
                    ) : null;
                  })}
                  {selectedSecrets.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{selectedSecrets.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button onClick={handleExport} variant="outline">
                {getIcon(exportType)}
                Generate Export
              </Button>
              {exportResult && (
                <div className="flex space-x-2">
                  <Button onClick={copyToClipboard} variant="outline" size="sm">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button onClick={downloadFile} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </div>

            {exportResult && (
              <div className="space-y-2">
                <Label>Export Result</Label>
                <Textarea
                  value={exportResult}
                  readOnly
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};