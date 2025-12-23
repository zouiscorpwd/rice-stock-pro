import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InventoryProvider } from "@/context/InventoryContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Purchase from "./pages/Purchase";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import Loose from "./pages/Loose";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <InventoryProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><MainLayout><Products /></MainLayout></ProtectedRoute>} />
            <Route path="/purchase" element={<ProtectedRoute><MainLayout><Purchase /></MainLayout></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute><MainLayout><Sales /></MainLayout></ProtectedRoute>} />
            <Route path="/loose" element={<ProtectedRoute><MainLayout><Loose /></MainLayout></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><MainLayout><Reports /></MainLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </InventoryProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
