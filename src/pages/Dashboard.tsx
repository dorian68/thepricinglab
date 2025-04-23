
import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import OverviewTab from "../components/dashboard/tabs/OverviewTab";
import ProgressTab from "../components/dashboard/tabs/ProgressTab";
import QuizzesTab from "../components/dashboard/tabs/QuizzesTab";
import AchievementsTab from "../components/dashboard/tabs/AchievementsTab";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { profile } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      {/* Welcome Message */}
      {profile && (
        <div className="bg-finance-burgundy/10 border-b border-finance-steel/10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <p className="text-finance-accent flex items-center gap-2">
              <span className="text-2xl">👋</span>
              Bonjour {profile.prenom}, ravi de vous revoir sur The Pricing Library !
            </p>
          </div>
        </div>
      )}
      
      {/* Dashboard Header */}
      <header className="py-8 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold terminal-text">Tableau de bord</h1>
              <p className="text-finance-lightgray">Bonjour, Julien. Continuez votre progression.</p>
            </div>
            
            <div className="flex space-x-4">
              <Link to="/courses" className="finance-button flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                Explorer les cours
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Dashboard Tabs */}
      <div className="border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex overflow-x-auto">
            <button 
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-4 font-medium text-sm ${
                activeTab === "overview" 
                  ? "border-b-2 border-finance-accent text-finance-offwhite" 
                  : "border-b-2 border-transparent text-finance-lightgray hover:text-finance-offwhite"
              }`}
            >
              Vue d'ensemble
            </button>
            <button 
              onClick={() => setActiveTab("progress")}
              className={`px-6 py-4 font-medium text-sm ${
                activeTab === "progress" 
                  ? "border-b-2 border-finance-accent text-finance-offwhite" 
                  : "border-b-2 border-transparent text-finance-lightgray hover:text-finance-offwhite"
              }`}
            >
              Progression
            </button>
            <button 
              onClick={() => setActiveTab("quizzes")}
              className={`px-6 py-4 font-medium text-sm ${
                activeTab === "quizzes" 
                  ? "border-b-2 border-finance-accent text-finance-offwhite" 
                  : "border-b-2 border-transparent text-finance-lightgray hover:text-finance-offwhite"
              }`}
            >
              Résultats Quiz
            </button>
            <button 
              onClick={() => setActiveTab("achievements")}
              className={`px-6 py-4 font-medium text-sm ${
                activeTab === "achievements" 
                  ? "border-b-2 border-finance-accent text-finance-offwhite" 
                  : "border-b-2 border-transparent text-finance-lightgray hover:text-finance-offwhite"
              }`}
            >
              Réalisations
            </button>
          </div>
        </div>
      </div>
      
      {/* Dashboard Content */}
      <main className="flex-1 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "progress" && <ProgressTab />}
          {activeTab === "quizzes" && <QuizzesTab />}
          {activeTab === "achievements" && <AchievementsTab />}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
