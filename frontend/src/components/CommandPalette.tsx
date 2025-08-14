import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Calculator, 
  Calendar, 
  CreditCard, 
  Search, 
  Settings,
  Users,
  Key,
  Plus,
  FileDown,
  FileUp,
  Trash2,
  Star,
  Copy
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import { useSecrets } from "@/contexts/SecretsContext"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { 
    secrets
  } = useSecrets()
  
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportExportDialog, setShowImportExportDialog] = useState(false)

  // Keyboard shortcut to open command palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <div 
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-md cursor-pointer hover:bg-muted/70 transition-colors"
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setOpen(true)
          }
        }}
        aria-label="Open command palette"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline-block">Search secrets...</span>
        <span className="sr-only sm:not-sr-only sm:hidden">Search</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-auto">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => runCommand(() => {
              setShowAddDialog(true)
            })}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Add New Secret</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => {
              setShowImportExportDialog(true)
            })}>
              <FileUp className="mr-2 h-4 w-4" />
              <span>Import/Export</span>
              <CommandShortcut>⌘I</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
              <CommandShortcut>⌘D</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/secrets"))}>
              <Key className="mr-2 h-4 w-4" />
              <span>All Secrets</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          {secrets.length > 0 && (
            <CommandGroup heading="Recent Secrets">
              {secrets.slice(0, 5).map((secret) => (
                <CommandItem
                  key={secret.id}
                  onSelect={() => runCommand(() => navigate(`/secrets/${secret.id}`))}
                >
                  <Key className="mr-2 h-4 w-4" />
                  <span>{secret.name}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">{secret.project.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}