
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  BarChart, 
  ChevronDown, 
  ChevronRight, 
  ArrowUpDown, 
  Filter, 
  Search,
  Calendar, 
  User2, 
  Activity, 
  Rocket,
  Flame,
  Zap,
  Target,
  TrendingUp,
  BarChart2
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

// Sample leaderboard data
const leaderboardData = [
  { 
    id: 1, 
    username: "QuantMaster", 
    score: 12500, 
    level: 32, 
    streak: 15, 
    badges: 24, 
    challenges: 89, 
    joinDate: "2023-08-15",
    country: "France",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=1480&auto=format&fit=crop"
  },
  { 
    id: 2, 
    username: "OptionPro", 
    score: 10800, 
    level: 29, 
    streak: 8, 
    badges: 21, 
    challenges: 76, 
    joinDate: "2023-09-22",
    country: "United Kingdom",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1480&auto=format&fit=crop"
  },
  { 
    id: 3, 
    username: "VolTrader", 
    score: 9200, 
    level: 25, 
    streak: 12, 
    badges: 18, 
    challenges: 65, 
    joinDate: "2023-10-05",
    country: "Germany",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1522&auto=format&fit=crop"
  },
  { 
    id: 4, 
    username: "AlgoFinance", 
    score: 8500, 
    level: 23, 
    streak: 7, 
    badges: 15, 
    challenges: 59, 
    joinDate: "2023-11-18",
    country: "United States",
    avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1480&auto=format&fit=crop"
  },
  { 
    id: 5, 
    username: "BlackScholes", 
    score: 7800, 
    level: 21, 
    streak: 5, 
    badges: 14, 
    challenges: 52, 
    joinDate: "2023-12-01",
    country: "Canada",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1470&auto=format&fit=crop"
  },
  { 
    id: 6, 
    username: "DerivMaster", 
    score: 7200, 
    level: 20, 
    streak: 3, 
    badges: 12, 
    challenges: 48, 
    joinDate: "2024-01-15",
    country: "Japan",
    avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=1480&auto=format&fit=crop"
  },
  { 
    id: 7, 
    username: "ArbitrageWiz", 
    score: 6800, 
    level: 19, 
    streak: 9, 
    badges: 11, 
    challenges: 45, 
    joinDate: "2024-01-28",
    country: "Switzerland",
    avatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=1470&auto=format&fit=crop"
  },
  { 
    id: 8, 
    username: "FixedIncomeTrader", 
    score: 6300, 
    level: 18, 
    streak: 4, 
    badges: 10, 
    challenges: 42, 
    joinDate: "2024-02-10",
    country: "Spain",
    avatar: "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?q=80&w=1374&auto=format&fit=crop"
  },
  { 
    id: 9, 
    username: "SwaptionExpert", 
    score: 5900, 
    level: 17, 
    streak: 6, 
    badges: 9, 
    challenges: 38, 
    joinDate: "2024-02-25",
    country: "Italy",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1374&auto=format&fit=crop"
  },
  { 
    id: 10, 
    username: "RiskModeller", 
    score: 5400, 
    level: 16, 
    streak: 2, 
    badges: 8, 
    challenges: 35, 
    joinDate: "2024-03-12",
    country: "Australia",
    avatar: "https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?q=80&w=1470&auto=format&fit=crop"
  }
];

// Badge showcase data
const badgeShowcaseData = [
  { 
    id: "streak_master", 
    name: "Streak Master", 
    description: "Maintenir une série de 10 jours consécutifs d'activité", 
    icon: <Flame className="h-5 w-5 text-yellow-400" />,
    rarity: "Rare"
  },
  { 
    id: "problem_solver", 
    name: "Problem Solver", 
    description: "Résoudre 50 exercices avec un taux de réussite supérieur à 80%", 
    icon: <Zap className="h-5 w-5 text-green-400" />,
    rarity: "Commun"
  },
  { 
    id: "first_place", 
    name: "First Place", 
    description: "Atteindre la première place du classement hebdomadaire", 
    icon: <Award className="h-5 w-5 text-purple-400" />,
    rarity: "Légendaire"
  },
  { 
    id: "survivor", 
    name: "Survivor", 
    description: "Compléter le Mode Survie avec 3 vies restantes", 
    icon: <Target className="h-5 w-5 text-red-400" />,
    rarity: "Épique"
  },
  { 
    id: "market_analyst", 
    name: "Market Analyst", 
    description: "Prédire correctement 10 mouvements de marché consécutifs", 
    icon: <TrendingUp className="h-5 w-5 text-blue-400" />,
    rarity: "Rare"
  }
];

// Monthly top performers
const monthlyTopPerformers = [
  { rank: 1, username: "QuantMaster", score: 4250, country: "France", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=1480&auto=format&fit=crop" },
  { rank: 2, username: "OptionPro", score: 3890, country: "United Kingdom", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1480&auto=format&fit=crop" },
  { rank: 3, username: "VolTrader", score: 3640, country: "Germany", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1522&auto=format&fit=crop" }
];

// Sort options
const sortOptions = [
  { id: "score", name: "Score" },
  { id: "level", name: "Niveau" },
  { id: "streak", name: "Série" },
  { id: "badges", name: "Badges" },
  { id: "challenges", name: "Défis" },
  { id: "join_date", name: "Date d'inscription" }
];

// Filter options
const filterOptions = [
  { id: "week", name: "Cette semaine" },
  { id: "month", name: "Ce mois" },
  { id: "year", name: "Cette année" },
  { id: "all_time", name: "Tout temps" }
];

const Leaderboard = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [timeFilter, setTimeFilter] = useState("all_time");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filter leaderboard data based on search query
  const filteredLeaderboard = leaderboardData.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort leaderboard data based on sort criteria
  const sortedLeaderboard = [...filteredLeaderboard].sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a];
    const bValue = b[sortBy as keyof typeof b];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === "asc" 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });
  
  // Toggle sort order
  const toggleSortOrder = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold terminal-text mb-2">{t('leaderboard.title')}</h1>
              <p className="text-finance-lightgray">
                {t('leaderboard.subtitle')}
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex gap-3">
              <button 
                className="finance-button-outline flex items-center"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {t('leaderboard.filter')}
              </button>
              <Link to="/survival-mode" className="finance-button flex items-center">
                <Activity className="mr-2 h-4 w-4" />
                {t('leaderboard.survivalMode')}
              </Link>
            </div>
          </div>
          
          {/* Monthly Top Performers */}
          <div className="finance-card p-6 mb-8">
            <h2 className="text-xl font-medium mb-6">{t('leaderboard.monthlyTopPerformers')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {monthlyTopPerformers.map((performer) => (
                <div key={performer.rank} className="relative finance-card p-4 border border-finance-steel/20">
                  <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-finance-dark flex items-center justify-center border border-finance-steel/20">
                    {performer.rank === 1 ? (
                      <Award className="h-5 w-5 text-yellow-400" />
                    ) : performer.rank === 2 ? (
                      <Award className="h-5 w-5 text-gray-300" />
                    ) : (
                      <Award className="h-5 w-5 text-amber-700" />
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full overflow-hidden mr-4">
                      <img 
                        src={performer.avatar} 
                        alt={performer.username} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-finance-offwhite">{performer.username}</div>
                      <div className="text-sm text-finance-lightgray">{performer.country}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-finance-steel/10">
                    <div className="text-sm text-finance-lightgray">{t('leaderboard.monthlyScore')}</div>
                    <div className="text-xl font-bold text-finance-accent">{performer.score.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Badge Showcase */}
          <div className="finance-card p-6 mb-8">
            <h2 className="text-xl font-medium mb-6">{t('leaderboard.badgeShowcase')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badgeShowcaseData.map((badge) => (
                <div key={badge.id} className="flex items-start p-4 border border-finance-steel/20 rounded">
                  <div className="p-3 rounded-full bg-finance-burgundy/20 mr-4">
                    {badge.icon}
                  </div>
                  <div>
                    <h3 className="text-finance-offwhite font-medium">{badge.name}</h3>
                    <div className="text-xs text-finance-accent mb-1">
                      {badge.rarity}
                    </div>
                    <p className="text-sm text-finance-lightgray">
                      {badge.description}
                    </p>
                  </div>
                </div>
              ))}
              
              <Link to="/profile/badges" className="flex items-center justify-center p-4 border border-finance-steel/20 rounded hover:bg-finance-steel/5">
                <span className="text-finance-accent flex items-center">
                  {t('leaderboard.viewAllBadges')} <ChevronRight className="ml-1 h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>
          
          {/* Leaderboard Table */}
          <div>
            <div className="finance-card p-4 mb-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-finance-lightgray" />
                    <input
                      type="text"
                      placeholder={t('leaderboard.searchPlaceholder')}
                      className="w-full bg-finance-charcoal/30 border border-finance-steel/20 rounded pl-10 pr-4 py-2 text-finance-offwhite placeholder:text-finance-lightgray focus:outline-none focus:border-finance-accent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((filter) => (
                    <button
                      key={filter.id}
                      className={`px-3 py-1.5 rounded text-sm ${
                        timeFilter === filter.id 
                          ? 'bg-finance-burgundy/20 text-finance-accent' 
                          : 'bg-finance-steel/10 text-finance-lightgray hover:bg-finance-steel/20'
                      }`}
                      onClick={() => setTimeFilter(filter.id)}
                    >
                      {filter.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-finance-charcoal/50 border-b border-finance-steel/10">
                  <tr>
                    <th className="px-4 py-3 text-sm font-medium">{t('leaderboard.rank')}</th>
                    <th className="px-4 py-3 text-sm font-medium">{t('leaderboard.player')}</th>
                    <th 
                      className="px-4 py-3 text-sm font-medium text-right cursor-pointer"
                      onClick={() => toggleSortOrder("score")}
                    >
                      <div className="flex items-center justify-end">
                        {t('leaderboard.score')}
                        <ArrowUpDown className="ml-1 h-3 w-3 text-finance-lightgray" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-sm font-medium text-right cursor-pointer"
                      onClick={() => toggleSortOrder("level")}
                    >
                      <div className="flex items-center justify-end">
                        {t('leaderboard.level')}
                        <ArrowUpDown className="ml-1 h-3 w-3 text-finance-lightgray" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-sm font-medium text-right cursor-pointer hidden md:table-cell"
                      onClick={() => toggleSortOrder("streak")}
                    >
                      <div className="flex items-center justify-end">
                        {t('leaderboard.streak')}
                        <ArrowUpDown className="ml-1 h-3 w-3 text-finance-lightgray" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-sm font-medium text-right cursor-pointer hidden lg:table-cell"
                      onClick={() => toggleSortOrder("badges")}
                    >
                      <div className="flex items-center justify-end">
                        {t('leaderboard.badges')}
                        <ArrowUpDown className="ml-1 h-3 w-3 text-finance-lightgray" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-sm font-medium text-right cursor-pointer hidden lg:table-cell"
                      onClick={() => toggleSortOrder("challenges")}
                    >
                      <div className="flex items-center justify-end">
                        {t('leaderboard.challenges')}
                        <ArrowUpDown className="ml-1 h-3 w-3 text-finance-lightgray" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-finance-steel/10">
                  {sortedLeaderboard.map((player, index) => (
                    <tr key={player.id} className="hover:bg-finance-steel/5">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center">
                          {index === 0 ? (
                            <span className="text-yellow-400 font-bold">#1</span>
                          ) : index === 1 ? (
                            <span className="text-finance-lightgray font-medium">#2</span>
                          ) : index === 2 ? (
                            <span className="text-amber-700 font-medium">#3</span>
                          ) : (
                            <span className="text-finance-lightgray">#{index + 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full overflow-hidden mr-3">
                            <img 
                              src={player.avatar} 
                              alt={player.username} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-finance-offwhite">{player.username}</div>
                            <div className="text-xs text-finance-lightgray">{player.country}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-finance-offwhite">
                        {player.score.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <Badge variant="level">Lvl {player.level}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-right hidden md:table-cell">
                        <div className="flex items-center justify-end">
                          <Activity className="h-3 w-3 text-finance-accent mr-1" />
                          <span>{player.streak}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right hidden lg:table-cell">
                        <div className="flex items-center justify-end">
                          <Award className="h-3 w-3 text-finance-accent mr-1" />
                          <span>{player.badges}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right hidden lg:table-cell">
                        <div className="flex items-center justify-end">
                          <Target className="h-3 w-3 text-finance-accent mr-1" />
                          <span>{player.challenges}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Leaderboard;
