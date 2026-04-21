import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import IncomePage from "./pages/Income.tsx";
import ExpensePage from "./pages/Expense.tsx";
import AuthPage from "./pages/Auth.tsx";
import OnboardingPage from "./pages/Onboarding.tsx";
import ClientsPage from "./pages/Clients.tsx";
import ProductsPage from "./pages/Products.tsx";
import ServicesPage from "./pages/Services.tsx";
import ReceivablesPage from "./pages/Receivables.tsx";
import PayablesPage from "./pages/Payables.tsx";
import CapitalPage from "./pages/Capital.tsx";
import NotesPage from "./pages/Notes.tsx";
import RemindersPage from "./pages/Reminders.tsx";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrgProvider } from "@/contexts/OrgContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Users,
  Package,
  Briefcase,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Settings,
} from "lucide-react";
import { PagePlaceholder } from "@/components/PagePlaceholder";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <OrgProvider>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/income" element={<IncomePage />} />
                  <Route path="/expense" element={<ExpensePage />} />
                  <Route path="/capital" element={<CapitalPage />} />
                  <Route path="/profit" element={<PagePlaceholder title="Profit & Loss" description="Live profit and loss across any period." icon={PiggyBank} />} />
                  <Route path="/clients" element={<ClientsPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/receivables" element={<ReceivablesPage />} />
                  <Route path="/payables" element={<PayablesPage />} />
                  <Route path="/notes" element={<NotesPage />} />
                  <Route path="/reminders" element={<RemindersPage />} />
                  <Route path="/reports" element={<PagePlaceholder title="Reports" description="P&L, income, expense and category reports." icon={BarChart3} />} />
                  <Route path="/settings" element={<PagePlaceholder title="Settings" description="Business profile, users and categories." icon={Settings} />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </OrgProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
