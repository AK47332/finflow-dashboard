import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import IncomePage from "./pages/Income.tsx";
import ExpensePage from "./pages/Expense.tsx";
import { AppLayout } from "@/components/layout/AppLayout";
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
  StickyNote,
  Bell,
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
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/income" element={<IncomePage />} />
            <Route path="/expense" element={<ExpensePage />} />
            <Route path="/capital" element={<PagePlaceholder title="Capital" description="Manage your starting capital and adjustments." icon={Wallet} />} />
            <Route path="/profit" element={<PagePlaceholder title="Profit & Loss" description="Live profit and loss across any period." icon={PiggyBank} />} />
            <Route path="/clients" element={<PagePlaceholder title="Clients" description="Your customer book and revenue per client." icon={Users} />} />
            <Route path="/products" element={<PagePlaceholder title="Products" description="Catalog of items you sell." icon={Package} />} />
            <Route path="/services" element={<PagePlaceholder title="Services" description="Service offerings and pricing." icon={Briefcase} />} />
            <Route path="/receivables" element={<PagePlaceholder title="Receivables" description="Money owed to you." icon={ArrowDownLeft} />} />
            <Route path="/payables" element={<PagePlaceholder title="Payables" description="Money you owe." icon={ArrowUpRight} />} />
            <Route path="/notes" element={<PagePlaceholder title="Notes" description="Quick notes, Google Keep style." icon={StickyNote} />} />
            <Route path="/reminders" element={<PagePlaceholder title="Reminders" description="Never miss a deadline again." icon={Bell} />} />
            <Route path="/reports" element={<PagePlaceholder title="Reports" description="P&L, income, expense and category reports." icon={BarChart3} />} />
            <Route path="/settings" element={<PagePlaceholder title="Settings" description="Business profile, users and categories." icon={Settings} />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
