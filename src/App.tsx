
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Tools from "./pages/Tools";
import Mentoring from "./pages/Mentoring";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Notebooks from "./pages/Notebooks";
import Exercises from "./pages/Exercises";
import Community from "./pages/Community";
import SurvivalMode from "./pages/SurvivalMode";
import Leaderboard from "./pages/Leaderboard";
import ExerciseDetail from "./pages/ExerciseDetail";
import CourseAdvanced from "./pages/CourseAdvanced";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/mentoring" element={<Mentoring />} />
          <Route path="/login" element={<Login />} />
          <Route path="/notebooks" element={<Notebooks />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/exercises/:id" element={<ExerciseDetail />} />
          <Route path="/community" element={<Community />} />
          <Route path="/survival-mode" element={<SurvivalMode />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/courses/advanced" element={<CourseAdvanced />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
