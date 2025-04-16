import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from 'react-query';
import { I18nextProvider } from 'react-i18next';
import { Toaster } from 'sonner';

import i18n from './i18n';
import Home from './pages/Home';
import Login from './pages/Login';
import Courses from './pages/Courses';
import BlackScholes from './pages/courses/BlackScholes';
import ExoticOptions from './pages/courses/ExoticOptions';
import Greeks from './pages/courses/Greeks';
import ImpliedVol from './pages/courses/ImpliedVol';
import MonteCarlo from './pages/courses/MonteCarlo';
import VolProducts from './pages/courses/VolProducts';
import YieldCurves from './pages/courses/YieldCurves';
import Practice from './pages/Practice';
import Exercises from './pages/Exercises';
import ExerciseDetail from './pages/ExerciseDetail';
import Quizzes from './pages/Quizzes';
import Tools from './pages/Tools';
import Community from './pages/Community';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Pricing from './pages/Pricing';
import Notebooks from './pages/Notebooks';
import Projects from './pages/Projects';
import Mentoring from './pages/Mentoring';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import SurvivalMode from './pages/SurvivalMode';
import SurvivalWaveDetail from './pages/SurvivalWaveDetail';
import BeginnerWave from './pages/survival/BeginnerWave';
import IntermediateWave from './pages/survival/IntermediateWave';
import AdvancedWave from './pages/survival/AdvancedWave';
import ExpertWave from './pages/survival/ExpertWave';
import MasterWave from './pages/survival/MasterWave';
import LegendaryWave from './pages/survival/LegendaryWave';
import NotFound from './pages/NotFound';
import AppShell from './components/AppShell';

const queryClient = new QueryClient();

const App = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <Helmet>
            <title>The Trading Lab - Plateforme d'apprentissage avancé pour les options financières</title>
            <meta name="description" content="Apprenez à trader les options financières comme un professionnel avec des cours interactifs, des simulations et des outils d'analyse avancés." />
          </Helmet>
          <Toaster position="top-right" />
          <BrowserRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/courses/black-scholes" element={<BlackScholes />} />
                <Route path="/courses/exotic-options" element={<ExoticOptions />} />
                <Route path="/courses/greeks" element={<Greeks />} />
                <Route path="/courses/implied-vol" element={<ImpliedVol />} />
                <Route path="/courses/monte-carlo" element={<MonteCarlo />} />
                <Route path="/courses/vol-products" element={<VolProducts />} />
                <Route path="/courses/yield-curves" element={<YieldCurves />} />
                <Route path="/practice" element={<Practice />} />
                <Route path="/exercises" element={<Exercises />} />
                <Route path="/exercises/:id" element={<ExerciseDetail />} />
                <Route path="/quizzes" element={<Quizzes />} />
                <Route path="/tools" element={<Tools />} />
                <Route path="/community" element={<Community />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/notebooks" element={<Notebooks />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/mentoring" element={<Mentoring />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/survival-mode" element={<SurvivalMode />} />
                <Route path="/survival-mode/wave/:id" element={<SurvivalWaveDetail />} />
                <Route path="/survival-mode/beginner" element={<BeginnerWave />} />
                <Route path="/survival-mode/intermediate" element={<IntermediateWave />} />
                <Route path="/survival-mode/advanced" element={<AdvancedWave />} />
                <Route path="/survival-mode/expert" element={<ExpertWave />} />
                <Route path="/survival-mode/master" element={<MasterWave />} />
                <Route path="/survival-mode/legendary" element={<LegendaryWave />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </QueryClientProvider>
      </HelmetProvider>
    </I18nextProvider>
  );
};

export default App;
