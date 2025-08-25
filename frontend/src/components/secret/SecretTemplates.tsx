import { useState } from "react";
import {
  Database,
  Key,
  Mail,
  CreditCard,
  Cloud,
  Globe,
  Lock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSecrets } from "@/contexts/SecretsContext";

interface TemplateField {
  name: string;
  identifier: string;
  value: string;
  description: string;
  tags: string[];
}

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  fields: TemplateField[];
}

const templates: Template[] = [
  {
    id: "database",
    name: "Database Connection",
    description: "Common database configuration secrets",
    icon: Database,
    category: "Database",
    fields: [
      {
        name: "Database URL",
        identifier: "DATABASE_URL",
        value: "postgresql://username:password@localhost:5432/dbname",
        description: "Primary database connection string",
        tags: ["database", "postgres"],
      },
      {
        name: "Database Host",
        identifier: "DB_HOST",
        value: "localhost",
        description: "Database server hostname",
        tags: ["database"],
      },
      {
        name: "Database Password",
        identifier: "DB_PASSWORD",
        value: "",
        description: "Database user password",
        tags: ["database", "auth"],
      },
    ],
  },
  {
    id: "auth",
    name: "Authentication",
    description: "JWT and authentication secrets",
    icon: Lock,
    category: "Authentication",
    fields: [
      {
        name: "JWT Secret",
        identifier: "JWT_SECRET",
        value: "",
        description: "Secret key for JWT token signing",
        tags: ["auth", "jwt"],
      },
      {
        name: "JWT Refresh Secret",
        identifier: "JWT_REFRESH_SECRET",
        value: "",
        description: "Secret key for JWT refresh tokens",
        tags: ["auth", "jwt"],
      },
      {
        name: "Session Secret",
        identifier: "SESSION_SECRET",
        value: "",
        description: "Secret for session encryption",
        tags: ["auth", "session"],
      },
    ],
  },
];

export function SecretTemplates() {
  const [open, setOpen] = useState(false);
  const { addSecret } = useSecrets();

  const handleUseTemplate = (template: Template) => {
    template.fields.forEach((field) => {
      addSecret({
        name: field.name,
        identifier: field.identifier,
        value: field.value,
        project: { name: "New Project", module: "" },
        environment: "development" as const,
        meta: {
          description: field.description,
          tags: field.tags,
          isActive: true,
        },
      });
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Zap className="h-4 w-4" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Secret Templates</DialogTitle>
          <DialogDescription>
            Select a template to quickly add common secrets
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <Card
                key={template.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{template.category}</Badge>
                      <Badge variant="outline">
                        {template.fields.length} secrets
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      {template.fields.slice(0, 3).map((field, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{field.name}</span>
                          <span className="text-muted-foreground ml-2">
                            ({field.identifier})
                          </span>
                        </div>
                      ))}
                      {template.fields.length > 3 && (
                        <div className="text-sm text-muted-foreground">
                          +{template.fields.length - 3} more...
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleUseTemplate(template)}
                      className="w-full"
                      size="sm"
                    >
                      Use This Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
