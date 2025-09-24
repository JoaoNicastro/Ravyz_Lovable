import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProfileSelection from "./pages/ProfileSelection";
import FillMethodSelection from "./pages/onboarding/FillMethodSelection";
import CandidateRegistration from "./pages/onboarding/CandidateRegistration";
import CandidateValidation from "./pages/onboarding/CandidateValidation";
import ProfessionalAssessment from "./pages/onboarding/ProfessionalAssessment";
import DreamJobBuilder from "./pages/onboarding/DreamJobBuilder";
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
            <Route path="/profile-selection" element={
              <ProtectedRoute>
                <ProfileSelection />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/fill-method" element={
              <ProtectedRoute>
                <FillMethodSelection />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/candidate" element={
              <ProtectedRoute>
                <CandidateRegistration />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/validation" element={
              <ProtectedRoute>
                <CandidateValidation />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/assessment" element={
              <ProtectedRoute>
                <ProfessionalAssessment />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/dream-job" element={
              <ProtectedRoute>
                <DreamJobBuilder />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
