import { useState, useMemo, KeyboardEvent } from "react";
import { useSecrets } from "@/contexts/SecretsContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface TagEditorProps {
  secretId: string;
  tags: string[];
}

export function TagEditor({ secretId, tags }: TagEditorProps) {
  const { allTags, updateSecretTags } = useSecrets();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const v = value.toLowerCase();
    if (!v) return [];
    return allTags
      .filter((t) => t.toLowerCase().includes(v) && !tags.includes(t))
      .slice(0, 6);
  }, [value, allTags, tags]);

  const addTag = (t: string) => {
    if (!t.trim()) return;
    if (tags.includes(t)) return;
    updateSecretTags(secretId, [...tags, t]);
    setValue("");
  };

  const removeTag = (t: string) => {
    updateSecretTags(
      secretId,
      tags.filter((x) => x !== t)
    );
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(value.trim());
    } else if (e.key === "Backspace" && !value && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <Badge
            key={t}
            variant="secondary"
            className="flex items-center gap-1 pr-1"
          >
            {t}
            <button
              onClick={() => removeTag(t)}
              className="hover:text-destructive"
              aria-label={`Remove tag ${t}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          className="w-40 h-7 text-xs"
          placeholder="Add tag..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={onKeyDown}
        />
      </div>
      {focused && suggestions.length > 0 && (
        <div className="border rounded-md bg-popover p-2 flex flex-wrap gap-1 max-w-sm">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => addTag(s)}
              className="px-2 py-1 text-xs rounded bg-muted hover:bg-accent"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
