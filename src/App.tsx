import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Home from "./pages/Home";
import Index from "./pages/Index";
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
import SurvivalWaveDetail from "./pages/SurvivalWaveDetail";
import Leaderboard from "./pages/Leaderboard";
import ExerciseDetail from "./pages/ExerciseDetail";
import CourseAdvanced from "./pages/CourseAdvanced";
import BlackScholesCourse from "./pages/courses/BlackScholes";
import YieldCurvesCourse from "./pages/courses/YieldCurves";
import GreeksCourse from "./pages/courses/Greeks";
import ImpliedVolCourse from "./pages/courses/ImpliedVol";
import VolProductsCourse from "./pages/courses/VolProducts";
import ExoticOptionsCourse from "./pages/courses/ExoticOptions";
import MonteCarloCourse from "./pages/courses/MonteCarlo";
import Pricing from "./pages/Pricing";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Practice from "./pages/Practice";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/home" element={<Home />} />
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
          <Route path="/community/forum" element={<Community />} />
          <Route path="/community/challenges" element={<Community />} />
          <Route path="/community/pair-programming" element={<Community />} />
          <Route path="/community/leaderboard" element={<Leaderboard />} />
          <Route path="/survival-mode" element={<SurvivalMode />} />
          <Route path="/survival-mode/wave/:id" element={<SurvivalWaveDetail />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/quizzes" element={<Exercises />} /> {/* Placeholder for future Quiz page */}
          <Route path="/advanced-simulations" element={<Exercises />} /> {/* Placeholder for future Simulations page */}
          <Route path="/progress" element={<Dashboard />} /> {/* Placeholder that redirects to dashboard for now */}
          <Route path="/training-lab" element={<Practice />} /> {/* New unified Training Lab page */}
          <Route path="/courses/advanced" element={<CourseAdvanced />} />
          <Route path="/courses/fundamentals/black-scholes" element={<BlackScholesCourse />} />
          <Route path="/courses/fundamentals/yield-curves" element={<YieldCurvesCourse />} />
          <Route path="/courses/fundamentals/greeks" element={<GreeksCourse />} />
          <Route path="/courses/advanced/implied-vol" element={<ImpliedVolCourse />} />
          <Route path="/courses/advanced/vol-products" element={<VolProductsCourse />} />
          <Route path="/courses/complex/exotic-options" element={<ExoticOptionsCourse />} />
          <Route path="/courses/complex/monte-carlo" element={<MonteCarloCourse />} />
          {/* Tool routes */}
          <Route path="/tools/volatility-calculator" element={<Tools />} />
          <Route path="/tools/black-scholes" element={<Tools />} />
          <Route path="/tools/monte-carlo" element={<Tools />} />
          <Route path="/tools/model-calibration" element={<Tools />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
