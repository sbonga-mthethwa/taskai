import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

// Public routes — keep eager so landing/login render instantly
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";

// Lazy-load everything else so the initial bundle stays small
const PricingPage = lazy(() => import("@/pages/PricingPage"));
const InvitationPage = lazy(() => import("@/pages/InvitationPage"));
const FirstLoginPage = lazy(() => import("@/pages/FirstLoginPage"));
const VerifyEmailPage = lazy(() => import("@/pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ProjectsPage = lazy(() => import("@/pages/ProjectsPage"));
const ProjectWorkspace = lazy(() => import("@/pages/ProjectWorkspace"));
const TasksPage = lazy(() => import("@/pages/TasksPage"));
const MessagesPage = lazy(() => import("@/pages/MessagesPage"));
const MyProfilePage = lazy(() => import("@/pages/MyProfilePage"));
const FilesPage = lazy(() => import("@/pages/FilesPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const AdminUsersPage = lazy(() => import("@/pages/AdminUsersPage"));
const TeamMemberProfilePage = lazy(() => import("@/pages/TeamMemberProfilePage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const RouteFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background" />
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/invite/:token" element={<InvitationPage />} />
              <Route path="/first-login" element={<FirstLoginPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Protected app routes */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectWorkspace />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/chats" element={<MessagesPage />} />
                <Route path="/chats/:contextType/:contextId" element={<MessagesPage />} />

                <Route path="/files" element={<FilesPage />} />
                <Route path="/documents" element={<FilesPage />} />

                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<MyProfilePage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/team" element={<AdminUsersPage />} />
                <Route path="/team/:id" element={<TeamMemberProfilePage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
