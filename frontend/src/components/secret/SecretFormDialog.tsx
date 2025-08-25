import { useState, useEffect } from "react";
import { useSecrets } from "@/contexts/SecretsContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Secret } from "@/types/secret";
import { useToast } from "@/hooks/use-toast";

interface SecretFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secret?: Secret;
}

export const SecretFormDialog: React.FC<SecretFormDialogProps> = ({
  open,
  onOpenChange,
  secret,
}) => {
  const { addSecret, updateSecret } = useSecrets();
  const { toast } = useToast();
  const isEditing = !!secret;

  const [formData, setFormData] = useState({
    name: "",
    identifier: "",
    value: "",
    projectName: "",
    projectModule: "",
    environment: "development" as
      | "development"
      | "production"
      | "testing"
      | "staging",
    description: "",
    tags: [] as string[],
    isActive: true,
    // Extended meta
    category: "",
    priority: "" as "" | "low" | "medium" | "high" | "critical",
    strength: "" as "" | "weak" | "moderate" | "strong",
    rotationEnabled: false,
    rotationIntervalDays: 90,
    rotationLastRotated: "", // yyyy-mm-dd
    quickCopyFormat: "" as "" | "env" | "json" | "identifier",
    usageFrequency: "" as "" | "daily" | "weekly" | "monthly" | "rare",
    usageLastUsedInProject: "",
    personalNotes: "",
    isFavorite: false,
  });

  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (secret) {
      setFormData({
        name: secret.name,
        identifier: secret.identifier,
        value: secret.value,
        projectName: secret.project.name,
        projectModule: secret.project.module || "",
        environment: secret.environment,
        description: secret.meta.description,
        tags: [...secret.meta.tags],
        isActive: secret.meta.isActive,
        category: secret.meta.category || "",
        priority:
          (secret.meta.priority as
            | "low"
            | "medium"
            | "high"
            | "critical"
            | undefined) || "",
        strength:
          (secret.meta.strength as
            | "weak"
            | "moderate"
            | "strong"
            | undefined) || "",
        rotationEnabled: !!secret.meta.rotationReminder?.enabled,
        rotationIntervalDays: secret.meta.rotationReminder?.intervalDays || 90,
        rotationLastRotated: secret.meta.rotationReminder?.lastRotated
          ? new Date(secret.meta.rotationReminder.lastRotated)
              .toISOString()
              .slice(0, 10)
          : "",
        quickCopyFormat:
          (secret.meta.quickCopyFormat as
            | "env"
            | "json"
            | "identifier"
            | undefined) || "",
        usageFrequency:
          (secret.meta.usagePattern?.frequency as
            | "daily"
            | "weekly"
            | "monthly"
            | "rare"
            | undefined) || "",
        usageLastUsedInProject:
          secret.meta.usagePattern?.lastUsedInProject || "",
        personalNotes: secret.meta.personalNotes || "",
        isFavorite: !!secret.meta.isFavorite,
      });
    } else {
      setFormData({
        name: "",
        identifier: "",
        value: "",
        projectName: "",
        projectModule: "",
        environment: "development",
        description: "",
        tags: [],
        isActive: true,
        category: "",
        priority: "",
        strength: "",
        rotationEnabled: false,
        rotationIntervalDays: 90,
        rotationLastRotated: "",
        quickCopyFormat: "",
        usageFrequency: "",
        usageLastUsedInProject: "",
        personalNotes: "",
        isFavorite: false,
      });
    }
    setNewTag("");
  }, [secret, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.identifier.trim() ||
      !formData.value.trim() ||
      !formData.projectName.trim()
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const rotationReminder = formData.rotationEnabled
      ? {
          enabled: true,
          intervalDays: formData.rotationIntervalDays,
          lastRotated: formData.rotationLastRotated
            ? new Date(formData.rotationLastRotated)
            : undefined,
          nextDue: formData.rotationLastRotated
            ? new Date(
                new Date(formData.rotationLastRotated).getTime() +
                  formData.rotationIntervalDays * 24 * 60 * 60 * 1000
              )
            : undefined,
        }
      : undefined;

    const usagePattern = formData.usageFrequency
      ? {
          frequency: formData.usageFrequency,
          lastUsedInProject: formData.usageLastUsedInProject || undefined,
        }
      : undefined;

    const secretData = {
      name: formData.name.trim(),
      identifier: formData.identifier.trim().toUpperCase(),
      value: formData.value.trim(),
      project: {
        name: formData.projectName.trim(),
        module: formData.projectModule.trim() || undefined,
      },
      environment: formData.environment,
      meta: {
        description: formData.description.trim(),
        tags: formData.tags,
        isActive: formData.isActive,
        category: formData.category || undefined,
        priority: formData.priority || undefined,
        strength: formData.strength || undefined,
        rotationReminder,
        quickCopyFormat: formData.quickCopyFormat || undefined,
        usagePattern,
        personalNotes: formData.personalNotes || undefined,
        isFavorite: formData.isFavorite,
      },
    };

    if (isEditing && secret) {
      updateSecret(secret.id, {
        ...secretData,
        meta: {
          ...secretData.meta,
          createdAt: secret.meta.createdAt,
          lastUpdated: new Date(),
        },
      });
      toast({
        title: "Secret updated",
        description: `${secretData.name} has been successfully updated.`,
      });
    } else {
      addSecret(secretData);
      toast({
        title: "Secret created",
        description: `${secretData.name} has been successfully created.`,
      });
    }

    onOpenChange(false);
  };

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const suggestedTags = [
    "database",
    "api",
    "auth",
    "payment",
    "email",
    "storage",
    "cache",
    "external",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Secret" : "Add New Secret"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the secret information below."
              : "Add a new environment variable or secret to your collection."}
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
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Database Connection String"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="identifier">Identifier *</Label>
              <Input
                id="identifier"
                value={formData.identifier}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    identifier: e.target.value.toUpperCase(),
                  }))
                }
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
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, value: e.target.value }))
              }
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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    projectName: e.target.value,
                  }))
                }
                placeholder="e.g., Taktix Backend"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectModule">Module (Optional)</Label>
              <Input
                id="projectModule"
                value={formData.projectModule}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    projectModule: e.target.value,
                  }))
                }
                placeholder="e.g., Authentication"
              />
            </div>
          </div>

          {/* Environment */}
          <div className="space-y-2">
            <Label htmlFor="environment">Environment *</Label>
            <Select
              value={formData.environment}
              onValueChange={(
                value: "development" | "production" | "testing" | "staging"
              ) => setFormData((prev) => ({ ...prev, environment: value }))}
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
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
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
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
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
                    .filter((tag) => !formData.tags.includes(tag))
                    .map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            tags: [...prev.tags, tag],
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

          {/* Active & Favorite */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isFavorite"
                checked={formData.isFavorite}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isFavorite: checked }))
                }
              />
              <Label htmlFor="isFavorite">Favorite</Label>
            </div>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            Inactive secrets are retained but excluded from active exports.
          </p>

          {/* Extended Meta Section */}
          <div className="border rounded-md p-4 space-y-4">
            <h3 className="font-medium text-sm tracking-wide text-muted-foreground">
              Extended Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, category: e.target.value }))
                  }
                  placeholder="e.g., database"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v: "low" | "medium" | "high" | "critical") =>
                    setFormData((p) => ({ ...p, priority: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="strength">Strength</Label>
                <Select
                  value={formData.strength}
                  onValueChange={(v: "weak" | "moderate" | "strong") =>
                    setFormData((p) => ({ ...p, strength: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weak">Weak</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="strong">Strong</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="rotationEnabled"
                  checked={formData.rotationEnabled}
                  onCheckedChange={(checked) =>
                    setFormData((p) => ({ ...p, rotationEnabled: checked }))
                  }
                />
                <Label htmlFor="rotationEnabled">Rotation Reminder</Label>
              </div>
              {formData.rotationEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rotationIntervalDays">
                      Interval (days)
                    </Label>
                    <Input
                      id="rotationIntervalDays"
                      type="number"
                      min={1}
                      value={formData.rotationIntervalDays}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          rotationIntervalDays: Number(e.target.value) || 1,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="rotationLastRotated">Last Rotated</Label>
                    <Input
                      id="rotationLastRotated"
                      type="date"
                      value={formData.rotationLastRotated}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          rotationLastRotated: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Copy & Usage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quickCopyFormat">Quick Copy Format</Label>
                <Select
                  value={formData.quickCopyFormat}
                  onValueChange={(v: "env" | "json" | "identifier") =>
                    setFormData((p) => ({ ...p, quickCopyFormat: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="env">.env (KEY=VALUE)</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="identifier">Identifier only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="usageFrequency">Usage Frequency</Label>
                <Select
                  value={formData.usageFrequency}
                  onValueChange={(v: "daily" | "weekly" | "monthly" | "rare") =>
                    setFormData((p) => ({ ...p, usageFrequency: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="rare">Rare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="usageLastUsedInProject">
                  Last Used In Project
                </Label>
                <Input
                  id="usageLastUsedInProject"
                  value={formData.usageLastUsedInProject}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      usageLastUsedInProject: e.target.value,
                    }))
                  }
                  placeholder="Project name"
                />
              </div>
            </div>

            {/* Personal Notes */}
            <div className="space-y-2">
              <Label htmlFor="personalNotes">Personal Notes</Label>
              <Textarea
                id="personalNotes"
                rows={3}
                value={formData.personalNotes}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, personalNotes: e.target.value }))
                }
                placeholder="Private notes about rotation steps, dependencies, etc."
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update Secret" : "Create Secret"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
