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
import PosPage from "./pages/Pos.tsx";
import ServicesPage from "./pages/Services.tsx";
import ReceivablesPage from "./pages/Receivables.tsx";
import PayablesPage from "./pages/Payables.tsx";
import CapitalPage from "./pages/Capital.tsx";
import NotesPage from "./pages/Notes.tsx";
import RemindersPage from "./pages/Reminders.tsx";
import ReportsPage from "./pages/Reports.tsx";
import SettingsPage from "./pages/Settings.tsx";
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
} from "lucide-react";
import { PagePlaceholder } from "@/components/PagePlaceholder";
import PortalPage from "./pages/Portal.tsx";
import CustomersAdminPage from "./pages/admin/Customers.tsx";
import { ExpiryGate } from "@/components/auth/ExpiryGate";
import StorefrontRoot from "./pages/StorefrontRoot.tsx";
import CustomerAccountPage from "./pages/CustomerAccount.tsx";
import FrontendMoodPage from "./pages/admin/FrontendMood.tsx";
import EcomOrdersPage from "./pages/admin/EcomOrders.tsx";
import EcomCategoriesPage from "./pages/admin/EcomCategories.tsx";
import EcomBannersPage from "./pages/admin/EcomBanners.tsx";
import EcomAnnouncementsPage from "./pages/admin/EcomAnnouncements.tsx";
import EcomInstagramPage from "./pages/admin/EcomInstagram.tsx";
import EcomCustomersPage from "./pages/admin/EcomCustomers.tsx";

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
              <Route path="/*" element={<StorefrontRoot />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/account" element={<CustomerAccountPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<ExpiryGate />}>
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Index />} />
                    <Route path="/income" element={<IncomePage />} />
                    <Route path="/expense" element={<ExpensePage />} />
                    <Route path="/capital" element={<CapitalPage />} />
                    <Route path="/profit" element={<PagePlaceholder title="Profit & Loss" description="Live profit and loss across any period." icon={PiggyBank} />} />
                    <Route path="/clients" element={<ClientsPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/pos" element={<PosPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/receivables" element={<ReceivablesPage />} />
                    <Route path="/payables" element={<PayablesPage />} />
                    <Route path="/notes" element={<NotesPage />} />
                    <Route path="/reminders" element={<RemindersPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/frontend-mood" element={<FrontendMoodPage />} />
                    <Route path="/ecom/orders" element={<EcomOrdersPage />} />
                    <Route path="/ecom/categories" element={<EcomCategoriesPage />} />
                    <Route path="/ecom/banners" element={<EcomBannersPage />} />
                    <Route path="/ecom/announcements" element={<EcomAnnouncementsPage />} />
                    <Route path="/ecom/instagram" element={<EcomInstagramPage />} />
                    <Route path="/ecom/customers" element={<EcomCustomersPage />} />
                    <Route path="/admin/customers" element={<CustomersAdminPage />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </OrgProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
