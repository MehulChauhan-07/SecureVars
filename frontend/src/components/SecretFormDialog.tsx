import { useState, useEffect } from 'react';
import { useSecrets } from '@/contexts/SecretsContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Secret } from '@/types/secret';
import { useToast } from '@/hooks/use-toast';

interface SecretFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secret?: Secret;
}

export const SecretFormDialog: React.FC<SecretFormDialogProps> = ({
  open,
  onOpenChange,
  secret
}) => {
  const { addSecret, updateSecret } = useSecrets();
  const { toast } = useToast();
  const isEditing = !!secret;

  const [formData, setFormData] = useState({
    name: '',
    identifier: '',
    value: '',
    projectName: '',
    projectModule: '',
    environment: 'development' as 'development' | 'production' | 'testing' | 'staging',
    description: '',
    tags: [] as string[],
    isActive: true
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (secret) {
      setFormData({
        name: secret.name,
        identifier: secret.identifier,
        value: secret.value,
        projectName: secret.project.name,
        projectModule: secret.project.module || '',
        environment: secret.environment,
        description: secret.meta.description,
        tags: [...secret.meta.tags],
        isActive: secret.meta.isActive
      });
    } else {
      setFormData({
        name: '',
        identifier: '',
        value: '',
        projectName: '',
        projectModule: '',
        environment: 'development',
        description: '',
        tags: [],
        isActive: true
      });
    }
    setNewTag('');
  }, [secret, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.identifier.trim() || !formData.value.trim() || !formData.projectName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const secretData = {
      name: formData.name.trim(),
      identifier: formData.identifier.trim().toUpperCase(),
      value: formData.value.trim(),
      project: {
        name: formData.projectName.trim(),
        module: formData.projectModule.trim() || undefined
      },
      environment: formData.environment,
      meta: {
        description: formData.description.trim(),
        tags: formData.tags,
        isActive: formData.isActive
      }
    };

    if (isEditing && secret) {
      updateSecret(secret.id, {
        ...secretData,
        meta: {
          ...secretData.meta,
          createdAt: secret.meta.createdAt,
          lastUpdated: new Date()
        }
      });
      toast({
        title: 'Secret updated',
        description: `${secretData.name} has been successfully updated.`,
      });
    } else {
      addSecret(secretData);
      toast({
        title: 'Secret created',
        description: `${secretData.name} has been successfully created.`,
      });
    }

    onOpenChange(false);
  };

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const suggestedTags = ['database', 'api', 'auth', 'payment', 'email', 'storage', 'cache', 'external'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Secret' : 'Add New Secret'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the secret information below.'
              : 'Add a new environment variable or secret to your collection.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Database Connection String"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="identifier">Identifier *</Label>
              <Input
                id="identifier"
                value={formData.identifier}
                onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value.toUpperCase() }))}
                placeholder="e.g., DATABASE_URL"
                className="font-mono"
              />
            </div>
          </div>

          {/* Secret Value */}
          <div className="space-y-2">
            <Label htmlFor="value">Secret Value *</Label>
            <Textarea
              id="value"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
              placeholder="Enter the secret value..."
              className="font-mono"
              rows={3}
            />
          </div>

          {/* Project Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                placeholder="e.g., Taktix Backend"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectModule">Module (Optional)</Label>
              <Input
                id="projectModule"
                value={formData.projectModule}
                onChange={(e) => setFormData(prev => ({ ...prev, projectModule: e.target.value }))}
                placeholder="e.g., Authentication"
              />
            </div>
          </div>

          {/* Environment */}
          <div className="space-y-2">
            <Label htmlFor="environment">Environment *</Label>
            <Select
              value={formData.environment}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, environment: value }))}
            >
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of what this secret is used for..."
              rows={2}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag..."
                  className="flex-1"
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              
              {/* Current Tags */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Suggested Tags */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Suggested tags:</p>
                <div className="flex flex-wrap gap-1">
                  {suggestedTags
                    .filter(tag => !formData.tags.includes(tag))
                    .map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            tags: [...prev.tags, tag]
                          }));
                        }}
                        className="text-xs px-2 py-1 bg-muted rounded-full hover:bg-muted/80 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive">Active</Label>
            <span className="text-sm text-muted-foreground">
              Inactive secrets are kept but not considered active
            </span>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Update Secret' : 'Create Secret'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};