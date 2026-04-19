import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import DashboardRedirect from "./pages/DashboardRedirect";
import NotFound from "./pages/NotFound";

import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminResults from "./pages/admin/AdminResults";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";

import StudentDashboard from "./pages/student/StudentDashboard";
import StudentResults from "./pages/student/StudentResults";

import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentChildren from "./pages/parent/ParentChildren";

import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import AnnouncementsList from "./pages/shared/AnnouncementsList";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute allow={["admin"]}><AdminOverview /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allow={["admin"]}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allow={["admin"]}><AdminStudents /></ProtectedRoute>} />
            <Route path="/admin/results" element={<ProtectedRoute allow={["admin"]}><AdminResults /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute allow={["admin"]}><AdminAnnouncements /></ProtectedRoute>} />

            {/* Teacher */}
            <Route path="/teacher" element={<ProtectedRoute allow={["teacher", "admin"]}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/students" element={<ProtectedRoute allow={["teacher", "admin"]}><AdminStudents /></ProtectedRoute>} />
            <Route path="/teacher/results" element={<ProtectedRoute allow={["teacher", "admin"]}><AdminResults /></ProtectedRoute>} />

            {/* Student */}
            <Route path="/student" element={<ProtectedRoute allow={["student"]}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/results" element={<ProtectedRoute allow={["student"]}><StudentResults /></ProtectedRoute>} />
            <Route path="/student/announcements" element={<ProtectedRoute allow={["student"]}><AnnouncementsList /></ProtectedRoute>} />

            {/* Parent */}
            <Route path="/parent" element={<ProtectedRoute allow={["parent"]}><ParentDashboard /></ProtectedRoute>} />
            <Route path="/parent/children" element={<ProtectedRoute allow={["parent"]}><ParentChildren /></ProtectedRoute>} />
            <Route path="/parent/announcements" element={<ProtectedRoute allow={["parent"]}><AnnouncementsList /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
