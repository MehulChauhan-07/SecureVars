import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Code, Database, Container, FileText } from "lucide-react";
import { Secret } from "@/types/secret";
import { useToast } from "@/hooks/use-toast";

interface CopyFormatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secret: Secret | null;
}

export const CopyFormatsDialog: React.FC<CopyFormatsDialogProps> = ({
  open,
  onOpenChange,
  secret,
}) => {
  const { toast } = useToast();
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  if (!secret) return null;

  const valueString = String(secret.value ?? "");

  const formats = {
    env: {
      icon: <FileText className="h-4 w-4" />,
      label: "Environment Variable",
      content: `${secret.identifier}=${valueString}`,
    },
    json: {
      icon: <Code className="h-4 w-4" />,
      label: "JSON Object",
      content: JSON.stringify(
        {
          [secret.identifier]: valueString,
        },
        null,
        2
      ),
    },
    javascript: {
      icon: <Code className="h-4 w-4" />,
      label: "JavaScript/Node.js",
      content: `const ${secret.identifier.toLowerCase()} = process.env.${
        secret.identifier
      };`,
    },
    python: {
      icon: <Code className="h-4 w-4" />,
      label: "Python",
      content: `import os\n${secret.identifier.toLowerCase()} = os.getenv('${
        secret.identifier
      }')`,
    },
    docker: {
      icon: <Container className="h-4 w-4" />,
      label: "Docker Compose",
      content: `environment:\n  - ${secret.identifier}=${valueString}`,
    },
    kubernetes: {
      icon: <Container className="h-4 w-4" />,
      label: "Kubernetes Secret",
      content: `apiVersion: v1
kind: Secret
metadata:
  name: ${secret.name.toLowerCase().replace(/\s+/g, "-")}
data:
  ${secret.identifier}: ${btoa(valueString)}`,
    },
    connection: {
      icon: <Database className="h-4 w-4" />,
      label: "Connection String",
      content: valueString.includes("://")
        ? valueString
        : `${secret.identifier}=${valueString}`,
    },
    shell: {
      icon: <FileText className="h-4 w-4" />,
      label: "Shell Export",
      content: `export ${secret.identifier}="${valueString}"`,
    },
  };

  const copyToClipboard = async (format: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
      toast({
        title: "Copied",
        description: `${
          formats[format as keyof typeof formats].label
        } copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Copy className="h-5 w-5" />
            <span>Copy in Different Formats</span>
          </DialogTitle>
          <DialogDescription>
            Copy {secret.name} in various formats for different use cases
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{secret.identifier}</Badge>
            <Badge
              variant="secondary"
              className={`text-white text-xs bg-env-${secret.environment}`}
            >
              {secret.environment}
            </Badge>
          </div>

          <Tabs defaultValue="env" className="space-y-4">
            <TabsList className="grid grid-cols-4 lg:grid-cols-8 h-auto">
              {Object.entries(formats).map(([key, format]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex flex-col items-center space-y-1 p-2"
                >
                  {format.icon}
                  <span className="text-xs">{format.label.split(" ")[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(formats).map(([key, format]) => (
              <TabsContent key={key} value={key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium flex items-center space-x-2">
                    {format.icon}
                    <span>{format.label}</span>
                  </h3>
                  <Button
                    onClick={() => copyToClipboard(key, format.content)}
                    variant="outline"
                    size="sm"
                  >
                    {copiedFormat === key ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                <Textarea
                  value={format.content}
                  readOnly
                  className="font-mono text-sm"
                  rows={Math.min(format.content.split("\n").length + 1, 10)}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
