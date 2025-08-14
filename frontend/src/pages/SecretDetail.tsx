import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSecrets } from '@/contexts/SecretsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Edit, Trash2, Power, PowerOff, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { SecretFormDialog } from '@/components/SecretFormDialog';
import { useToast } from '@/hooks/use-toast';

const SecretDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { secrets, deleteSecret, toggleSecretStatus } = useSecrets();
  const { toast } = useToast();
  const [showValue, setShowValue] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const secret = secrets.find(s => s.id === id);

  if (!secret) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Secret Not Found</h1>
        <p className="text-muted-foreground mb-4">The secret you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/secrets">Back to Secrets</Link>
        </Button>
      </div>
    );
  }

  const getEnvironmentColor = (env: string) => {
    const colors = {
      development: 'bg-env-development',
      production: 'bg-env-production',
      testing: 'bg-env-testing',
      staging: 'bg-env-staging'
    };
    return colors[env as keyof typeof colors] || 'bg-gray-500';
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to clipboard',
        description: `${label} has been copied to your clipboard.`,
      });
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Unable to copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${secret.name}"?`)) {
      deleteSecret(secret.id);
      toast({
        title: 'Secret deleted',
        description: `${secret.name} has been permanently deleted.`,
      });
      navigate('/secrets');
    }
  };

  const handleToggleStatus = () => {
    toggleSecretStatus(secret.id);
    toast({
      title: secret.meta.isActive ? 'Secret deactivated' : 'Secret activated',
      description: `${secret.name} is now ${secret.meta.isActive ? 'inactive' : 'active'}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/secrets">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Secrets
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{secret.name}</h1>
            <p className="text-muted-foreground mt-1">
              {secret.project.name}
              {secret.project.module && ` • ${secret.project.module}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleToggleStatus}
          >
            {secret.meta.isActive ? (
              <>
                <PowerOff className="h-4 w-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Secret Value */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Secret Value</CardTitle>
            <CardDescription>
              The actual secret value - handle with care
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Identifier</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm">
                  {secret.identifier}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(secret.identifier, 'Identifier')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Value</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                  {showValue ? secret.value : '••••••••••••••••••••••••••••••••'}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowValue(!showValue)}
                >
                  {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(secret.value, 'Secret value')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {secret.meta.description && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <p className="p-3 bg-muted rounded-lg text-sm">
                  {secret.meta.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>
              Secret information and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Environment</label>
              <Badge
                variant="secondary"
                className={`text-white ${getEnvironmentColor(secret.environment)}`}
              >
                {secret.environment}
              </Badge>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Badge
                variant={secret.meta.isActive ? "default" : "secondary"}
                className={secret.meta.isActive ? "bg-status-active text-white" : "bg-status-inactive text-white"}
              >
                {secret.meta.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {secret.meta.tags.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-1">
                  {secret.meta.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Created</label>
              <p className="text-sm text-muted-foreground">
                {secret.meta.createdAt.toLocaleDateString()} at{' '}
                {secret.meta.createdAt.toLocaleTimeString()}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Last Updated</label>
              <p className="text-sm text-muted-foreground">
                {secret.meta.lastUpdated.toLocaleDateString()} at{' '}
                {secret.meta.lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <SecretFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        secret={secret}
      />
    </div>
  );
};

export default SecretDetail;