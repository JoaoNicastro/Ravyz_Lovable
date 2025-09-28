import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import ProfileSelection from "./pages/ProfileSelection";
import OnboardingFlow from "./pages/onboarding/OnboardingFlow";
import CompanyProfile from "./pages/company/CompanyProfile";
import CompanyOnboardingFlow from "./pages/onboarding/CompanyOnboardingFlow";
import CandidateDashboard from "./pages/dashboard/CandidateDashboard";
import CompanyDashboard from "./pages/dashboard/CompanyDashboard";
import ResumeAnalyze from "./pages/ResumeAnalyze";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile-selection" element={<ProfileSelection />} />
            <Route path="/onboarding/candidate" element={<OnboardingFlow />} />
            <Route path="/onboarding/company" element={<CompanyOnboardingFlow />} />
            <Route path="/company/profile" element={<CompanyProfile />} />
            <Route path="/dashboard/candidate" element={<CandidateDashboard />} />
            <Route path="/dashboard/company" element={<CompanyDashboard />} />
            <Route path="/resume/analyze" element={<ResumeAnalyze />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
