import { Outlet, NavLink, Link } from "react-router-dom";
import { Shield, Home, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SecretFormDialog } from "@/components/secret/SecretFormDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CommandPalette } from "@/components/secret/CommandPalette";
// import { CommandPalette } from "../command/CommandPallete";
import { ModeToggle } from "../shared/ModeToggle";

const Layout = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-primary" />
                <Link to="/" className="text-2xl font-bold text-foreground">
                  SecretVars
                </Link>
              </div>

              <nav className="flex items-center space-x-6">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`
                  }
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </NavLink>

                <NavLink
                  to="/secrets"
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`
                  }
                >
                  <List className="h-4 w-4" />
                  <span>All Secrets</span>
                </NavLink>
              </nav>
            </div>

            {/* Search/Command Palette */}
            <div className="flex-1 max-w-sm mx-4">
              <CommandPalette />
            </div>

            <div className="flex items-center space-x-2">
              <ThemeToggle />
              {/* <ModeToggle /> */}
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Secret</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Outlet />
      </main>

      {/* Add Secret Dialog */}
      <SecretFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
};

export default Layout;
