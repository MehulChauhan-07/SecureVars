import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SecretsProvider } from "@/contexts/SecretsContext";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import SecretsList from "@/pages/SecretsList";
import SecretDetail from "@/pages/SecretDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SecretsProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="secrets" element={<SecretsList />} />
              <Route path="secrets/:id" element={<SecretDetail />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SecretsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
