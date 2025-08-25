import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, initialize, isInitialized } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isInitialized) {
        await login(password);
      } else {
        await initialize(password);
      }
      navigate("/");
    } catch (error) {
      console.error("Authentication failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isInitialized ? "Enter Master Password" : "Initialize System"}
          </CardTitle>
          <CardDescription className="text-center">
            {isInitialized
              ? "Enter your master password to access your secrets"
              : "Create a master password for initial system setup"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                {isInitialized ? "Master Password" : "Create Master Password"}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                placeholder={
                  isInitialized
                    ? "Enter your master password"
                    : "Create a strong master password"
                }
              />
            </div>
            {!isInitialized && (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">Important:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>Store this password securely - it cannot be recovered</li>
                  <li>
                    Use a strong password with mixed case, numbers, and symbols
                  </li>
                  <li>This password protects all your stored secrets</li>
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={!password.trim() || isLoading}
            >
              {isLoading
                ? "Processing..."
                : isInitialized
                ? "Login"
                : "Initialize System"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
