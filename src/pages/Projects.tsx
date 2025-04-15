
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { Calendar, Clock, Trophy, ArrowRight, Users, FileText, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProjectCardProps {
  title: string;
  description: string;
  startDate: string;
  duration: string;
  difficulty: string;
  participants: number;
  active: boolean;
  path: string;
}

const ProjectCard = ({
  title,
  description,
  startDate,
  duration,
  difficulty,
  participants,
  active,
  path
}: ProjectCardProps) => {
  const { t } = useTranslation();
  
  return (
    <div className={`finance-card p-6 ${active ? "border-finance-accent/30" : ""}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-medium text-finance-offwhite">{title}</h3>
        {active ? (
          <span className="terminal-text text-xs px-2 py-1 bg-finance-accent/10 rounded text-finance-accent">
            {t('projects.active')}
          </span>
        ) : (
          <span className="terminal-text text-xs px-2 py-1 bg-finance-steel/10 rounded text-finance-lightgray">
            {t('projects.upcoming')}
          </span>
        )}
      </div>
      
      <p className="text-finance-lightgray text-sm mb-6">{description}</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-finance-accent mr-2" />
          <span className="text-finance-lightgray text-xs">{startDate}</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-finance-accent mr-2" />
          <span className="text-finance-lightgray text-xs">{duration}</span>
        </div>
        <div className="flex items-center">
          <BarChart3 className="h-4 w-4 text-finance-accent mr-2" />
          <span className="text-finance-lightgray text-xs">{difficulty}</span>
        </div>
        <div className="flex items-center">
          <Users className="h-4 w-4 text-finance-accent mr-2" />
          <span className="text-finance-lightgray text-xs">{participants} {t('projects.participants')}</span>
        </div>
      </div>
      
      <Link 
        to={path}
        className={`flex justify-between items-center p-3 rounded ${
          active 
            ? "bg-finance-burgundy/10 text-finance-accent hover:bg-finance-burgundy/20 transition-colors duration-300" 
            : "bg-finance-steel/10 text-finance-lightgray cursor-not-allowed"
        }`}
      >
        <span className="text-sm font-medium">
          {active ? t('projects.viewDetails') : t('projects.notAvailable')}
        </span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
};

// Leaderboard entry component
const LeaderboardEntry = ({ 
  rank, 
  name, 
  score, 
  isCurrentUser = false 
}: { 
  rank: number; 
  name: string; 
  score: number; 
  isCurrentUser?: boolean;
}) => {
  const { t } = useTranslation();
  
  return (
    <div className={`grid grid-cols-3 py-3 px-4 ${isCurrentUser ? "bg-finance-burgundy/10 rounded-md" : ""} ${rank <= 3 ? "font-medium" : ""}`}>
      <div className="flex items-center">
        {rank <= 3 ? (
          <div className={`h-6 w-6 rounded-full flex items-center justify-center mr-2 text-xs font-medium
            ${rank === 1 ? "bg-yellow-500/20 text-yellow-400" : 
              rank === 2 ? "bg-gray-400/20 text-gray-300" : 
              "bg-amber-700/20 text-amber-600"}`
          }>
            {rank}
          </div>
        ) : (
          <span className="text-finance-lightgray mr-2">{rank}</span>
        )}
        <span className={`${isCurrentUser ? "text-finance-accent" : ""}`}>{name}</span>
        {isCurrentUser && <span className="ml-2 text-xs text-finance-lightgray">(vous)</span>}
      </div>
      <div className="text-center">{score}</div>
      <div className="text-right">
        {rank === 1 ? (
          <Trophy className="h-4 w-4 text-yellow-400 inline-block" />
        ) : rank === 2 ? (
          <Trophy className="h-4 w-4 text-gray-300 inline-block" />
        ) : rank === 3 ? (
          <Trophy className="h-4 w-4 text-amber-600 inline-block" />
        ) : null}
      </div>
    </div>
  );
};

const Projects = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      {/* Projects Header */}
      <header className="py-12 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 terminal-text">{t('projects.title')}</h1>
            <p className="text-finance-lightgray text-lg max-w-2xl mx-auto">
              {t('projects.subtitle')}
            </p>
          </div>
        </div>
      </header>
      
      {/* Active Project */}
      <section className="py-12 px-6 bg-finance-charcoal/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 terminal-text">{t('projects.monthlyChallenge')}</h2>
          
          <div className="finance-card p-8 border-l-4 border-l-finance-accent">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
              <div>
                <h3 className="text-2xl font-medium text-finance-offwhite mb-2">
                  {t('projects.optionPricingTitle')}
                </h3>
                <p className="text-finance-lightgray mb-4 md:mb-0">
                  {t('projects.optionPricingDesc')}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="terminal-text text-xs px-3 py-1.5 bg-finance-accent/10 rounded text-finance-accent">
                  {t('projects.active')}
                </span>
                <span className="terminal-text text-xs px-3 py-1.5 bg-finance-steel/10 rounded text-finance-lightgray">
                  {t('projects.endsIn')}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="finance-card p-4">
                <h4 className="font-medium mb-2 flex items-center">
                  <FileText className="h-4 w-4 text-finance-accent mr-2" />
                  {t('projects.description')}
                </h4>
                <p className="text-finance-lightgray text-sm">
                  {t('projects.optionPricingDesc')}
                </p>
              </div>
              
              <div className="finance-card p-4">
                <h4 className="font-medium mb-2 flex items-center">
                  <BarChart3 className="h-4 w-4 text-finance-accent mr-2" />
                  {t('projects.requirements')}
                </h4>
                <ul className="text-finance-lightgray text-sm space-y-1">
                  <li>• {t('projects.implementPython')}</li>
                  <li>• {t('projects.handleSmile')}</li>
                  <li>• {t('projects.includeDocumentation')}</li>
                  <li>• {t('projects.optimizePerformance')}</li>
                </ul>
              </div>
              
              <div className="finance-card p-4">
                <h4 className="font-medium mb-2 flex items-center">
                  <Trophy className="h-4 w-4 text-finance-accent mr-2" />
                  {t('projects.rewards')}
                </h4>
                <ul className="text-finance-lightgray text-sm space-y-1">
                  <li>• {t('projects.firstPrize')}</li>
                  <li>• {t('projects.secondPrize')}</li>
                  <li>• {t('projects.thirdPrize')}</li>
                  <li>• {t('projects.allParticipants')}</li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/projects/option-pricing" className="finance-button text-center">
                {t('projects.viewDetails')}
              </Link>
              <Link to="/projects/option-pricing/resources" className="finance-button-outline text-center">
                {t('projects.resources')}
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Upcoming Projects */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 terminal-text">{t('projects.upcoming')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProjectCard
              title={t('projects.monteCarloTitle')}
              description={t('projects.monteCarloDesc')}
              startDate={`${t('projects.starts')} 1er mai 2025`}
              duration={`2 ${t('projects.weeks')}`}
              difficulty={t('projects.advanced')}
              participants={34}
              active={false}
              path="/projects/monte-carlo"
            />
            
            <ProjectCard
              title={t('projects.portfolioOptTitle')}
              description={t('projects.portfolioOptDesc')}
              startDate={`${t('projects.starts')} 15 mai 2025`}
              duration={`3 ${t('projects.weeks')}`}
              difficulty={t('projects.intermediate')}
              participants={51}
              active={false}
              path="/projects/portfolio-optimization"
            />
            
            <ProjectCard
              title={t('projects.volSurfaceTitle')}
              description={t('projects.volSurfaceDesc')}
              startDate={`${t('projects.starts')} 1er juin 2025`}
              duration={`2 ${t('projects.weeks')}`}
              difficulty={t('projects.expert')}
              participants={28}
              active={false}
              path="/projects/vol-surface"
            />
            
            <ProjectCard
              title={t('projects.algoTradingTitle')}
              description={t('projects.algoTradingDesc')}
              startDate={`${t('projects.starts')} 15 juin 2025`}
              duration={`4 ${t('projects.weeks')}`}
              difficulty={t('projects.expert')}
              participants={45}
              active={false}
              path="/projects/algo-trading"
            />
          </div>
        </div>
      </section>
      
      {/* Leaderboard Section */}
      <section className="py-12 px-6 bg-finance-charcoal/20 border-t border-finance-steel/10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center terminal-text">{t('projects.leaderboard')}</h2>
          
          <div className="finance-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">{t('projects.previousChallenge')}</h3>
              <span className="text-xs text-finance-lightgray">{t('projects.completed')} 31 mars 2025</span>
            </div>
            
            <div className="mb-4">
              <div className="grid grid-cols-3 py-2 text-finance-lightgray text-sm">
                <div>{t('projects.participant')}</div>
                <div className="text-center">{t('projects.score')}</div>
                <div className="text-right">{t('projects.reward')}</div>
              </div>
              
              <LeaderboardEntry rank={1} name="Thomas Laurent" score={98.5} />
              <LeaderboardEntry rank={2} name="Marine Dubois" score={97.2} />
              <LeaderboardEntry rank={3} name="Nicolas Mercier" score={94.1} />
              <LeaderboardEntry rank={4} name="Sophie Bernard" score={91.8} />
              <LeaderboardEntry rank={5} name="Julien Gauthier" score={90.3} isCurrentUser={true} />
              <LeaderboardEntry rank={6} name="Emma Rousseau" score={87.9} />
              <LeaderboardEntry rank={7} name="Alexandre Martin" score={84.2} />
              <LeaderboardEntry rank={8} name="Claire Dupont" score={82.7} />
              <LeaderboardEntry rank={9} name="Lucas Moreau" score={80.5} />
              <LeaderboardEntry rank={10} name="Camille Lefebvre" score={78.9} />
            </div>
            
            <div className="text-center">
              <Link to="/projects/interest-rates/leaderboard" className="text-finance-accent text-sm flex items-center justify-center">
                {t('projects.viewAll')} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Community CTA */}
      <section className="py-12 px-6 bg-finance-charcoal/50 border-t border-finance-steel/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 terminal-text">{t('projects.joinCommunity')}</h2>
          <p className="text-finance-lightgray mb-8">
            {t('projects.communityDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="finance-button text-center">
              {t('projects.subscribe')}
            </Link>
            <Link to="/courses" className="finance-button-outline text-center">
              {t('projects.discover')}
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Projects;
