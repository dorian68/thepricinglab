
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { Toaster } from 'sonner';
import ChatBubble from './components/chat/ChatBubble';
import { AuthProvider } from './contexts/AuthContext';

import i18n from './i18n';
import Home from './pages/Home';
import Login from './pages/auth/Login';
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
import BugReport from './pages/BugReport';
import NotFound from './pages/NotFound';
import AppShell from './components/AppShell';
import SignUp from './pages/SignUp';
import Jobs from './pages/Jobs';

// Pages de la communauté
import Forum from './pages/community/Forum';
import Chat from './pages/community/Chat';
import WeeklyChallenge from './pages/community/WeeklyChallenge';
import PairProgramming from './pages/community/PairProgramming';
import Explore from './pages/community/Explore';
import Contribute from './pages/community/Contribute';
import ArticleDetail from './pages/community/ArticleDetail';
import StrategyDetail from './pages/community/StrategyDetail';
import StrategyBuilder from './pages/community/StrategyBuilder';
import Playground from './pages/community/Playground';
import SharedNotebook from './pages/community/SharedNotebook';

import VolatilityCalculator from './components/tools/VolatilityCalculator';
import BlackScholesCalculator from './components/tools/BlackScholesCalculator';
import MonteCarloSimulator from './components/tools/MonteCarloSimulator';
import ModelCalibration from './components/tools/ModelCalibration';
import PayoffVisualizer from './pages/tools/PayoffVisualizer';

import TradingExercises from './pages/trading/TradingExercises';
import Backtest from './pages/trading/Backtest';
import Scenarios from './pages/trading/Scenarios';
import Strategies from './pages/trading/Strategies';
import Performance from './pages/trading/Performance';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRouteGuard from './components/admin/AdminRouteGuard';
import CourseAdvanced from './pages/CourseAdvanced';

const queryClient = new QueryClient();

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Helmet>
              <title>The Pricing Library - Plateforme d'apprentissage avancé pour les options financières</title>
              <meta name="description" content="Apprenez à maitriser les options financières avec des cours interactifs, des simulateurs et des outils d'analyse avancés. Black-Scholes, Monte Carlo, Volatilité et plus." />
              <meta name="keywords" content="pricing financier, options, black-scholes, monte carlo, volatilité, finance quantitative, simulateurs financiers" />
              <link rel="canonical" href="https://thepricinglab.com" />
            </Helmet>
            <Toaster position="top-right" />
            <Router>
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<Home />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/courses/fundamentals/black-scholes" element={<BlackScholes />} />
                  <Route path="/courses/complex/exotic-options" element={<ExoticOptions />} />
                  <Route path="/courses/fundamentals/greeks" element={<Greeks />} />
                  <Route path="/courses/advanced/implied-vol" element={<ImpliedVol />} />
                  <Route path="/courses/complex/monte-carlo" element={<MonteCarlo />} />
                  <Route path="/courses/advanced/vol-products" element={<VolProducts />} />
                  <Route path="/courses/fundamentals/yield-curves" element={<YieldCurves />} />
                  <Route path="/courses/advanced" element={<CourseAdvanced />} />
                  <Route path="/practice" element={<Practice />} />
                  <Route path="/exercises" element={<Exercises />} />
                  <Route path="/exercises/:id" element={<ExerciseDetail />} />
                  <Route path="/quizzes" element={<Quizzes />} />
                  <Route path="/tools" element={<Tools />} />
                  <Route path="/tools/volatility-calculator" element={<VolatilityCalculator />} />
                  <Route path="/tools/black-scholes" element={<BlackScholesCalculator />} />
                  <Route path="/tools/monte-carlo" element={<MonteCarloSimulator />} />
                  <Route path="/tools/model-calibration" element={<ModelCalibration />} />
                  <Route path="/tools/payoff-visualizer" element={<PayoffVisualizer />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/community/chat" element={<Chat />} />
                  <Route path="/community/forum" element={<Forum />} />
                  <Route path="/community/contribute" element={<Contribute />} />
                  <Route path="/community/explore" element={<Explore />} />
                  <Route path="/community/playground" element={<Playground />} />
                  <Route path="/community/playground/shared" element={<SharedNotebook />} />
                  <Route path="/community/strategy-builder" element={<StrategyBuilder />} />
                  <Route path="/community/strategy/:id" element={<StrategyDetail />} />
                  <Route path="/community/article/:id" element={<ArticleDetail />} />
                  <Route path="/community/pair-programming" element={<PairProgramming />} />
                  <Route path="/community/weekly-challenge" element={<WeeklyChallenge />} />
                  
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
                  <Route path="/bug-report" element={<BugReport />} />
                  
                  <Route path="/trading/exercises" element={<TradingExercises />} />
                  <Route path="/trading/backtest" element={<Backtest />} />
                  <Route path="/trading/scenarios" element={<Scenarios />} />
                  <Route path="/trading/strategies" element={<Strategies />} />
                  <Route path="/trading/performance" element={<Performance />} />
                  
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/admin-dashboard" element={
                    <AdminRouteGuard>
                      <AdminDashboard />
                    </AdminRouteGuard>
                  } />
                  
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Router>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </I18nextProvider>
  );
};

export default App;
