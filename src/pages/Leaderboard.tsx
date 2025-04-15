
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  Activity,
  User2,
  Crown,
  Search,
  Filter,
  Medal,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Clock,
  CheckCircle,
  BarChart,
  TrendingUp,
  Zap,
  BookOpen
} from "lucide-react";
import { useTranslation } from "react-i18next";

// Sample leaderboard data
const leaderboardData = [
  { 
    id: 1, 
    username: "QuantMaster", 
    realName: "Sophie Laurent",
    score: 25840, 
    level: 42, 
    streak: 23,
    completedExercises: 145,
    completedCourses: 8,
    badges: 12,
    accuracy: 94,
    memberSince: "Jan 2025",
    lastActive: "Today",
    rank: 1,
    prevRank: 1,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  { 
    id: 2, 
    username: "OptionPro", 
    realName: "Thomas Dubois",
    score: 23150, 
    level: 38, 
    streak: 15,
    completedExercises: 132,
    completedCourses: 7,
    badges: 10,
    accuracy: 91,
    memberSince: "Feb 2025",
    lastActive: "Today",
    rank: 2,
    prevRank: 3,
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  { 
    id: 3, 
    username: "VolTrader", 
    realName: "Marie Bernard",
    score: 21780, 
    level: 36, 
    streak: 19,
    completedExercises: 128,
    completedCourses: 6,
    badges: 11,
    accuracy: 88,
    memberSince: "Dec 2024",
    lastActive: "Yesterday",
    rank: 3,
    prevRank: 2,
    avatar: "https://images.unsplash.com/photo-1601412436009-d964bd02edbc?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  { 
    id: 4, 
    username: "AlgoFinance", 
    realName: "Lucas Martin",
    score: 19540, 
    level: 33, 
    streak: 12,
    completedExercises: 115,
    completedCourses: 6,
    badges: 9,
    accuracy: 85,
    memberSince: "Jan 2025",
    lastActive: "2 days ago",
    rank: 4,
    prevRank: 5,
    avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  { 
    id: 5, 
    username: "BlackScholes", 
    realName: "Camille Petit",
    score: 18920, 
    level: 31, 
    streak: 8,
    completedExercises: 103,
    completedCourses: 5,
    badges: 8,
    accuracy: 83,
    memberSince: "Mar 2025",
    lastActive: "Today",
    rank: 5,
    prevRank: 4,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  { 
    id: 6, 
    username: "DerivativeNinja", 
    realName: "Alexandre Dupont",
    score: 17650, 
    level: 29, 
    streak: 11,
    completedExercises: 98,
    completedCourses: 5,
    badges: 7,
    accuracy: 86,
    memberSince: "Feb 2025",
    lastActive: "Today",
    rank: 6,
    prevRank: 6,
    avatar: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  { 
    id: 7, 
    username: "RiskManager", 
    realName: "Julie Moreau",
    score: 16480, 
    level: 27, 
    streak: 7,
    completedExercises: 92,
    completedCourses: 4,
    badges: 6,
    accuracy: 82,
    memberSince: "Jan 2025",
    lastActive: "Yesterday",
    rank: 7,
    prevRank: 7,
    avatar: "https://images.unsplash.com/photo-1569913486515-b74bf7751574?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  { 
    id: 8, 
    username: "HedgeFundPro", 
    realName: "Nathalie Legrand",
    score: 15320, 
    level: 26, 
    streak: 5,
    completedExercises: 88,
    completedCourses: 4,
    badges: 6,
    accuracy: 81,
    memberSince: "Mar 2025",
    lastActive: "3 days ago",
    rank: 8,
    prevRank: 9,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  { 
    id: 9, 
    username: "FinanceWhiz", 
    realName: "Paul Simon",
    score: 14760, 
    level: 25, 
    streak: 9,
    completedExercises: 83,
    completedCourses: 4,
    badges: 5,
    accuracy: 80,
    memberSince: "Feb 2025",
    lastActive: "Yesterday",
    rank: 9,
    prevRank: 8,
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  { 
    id: 10, 
    username: "QuantTrader", 
    realName: "Emma Rousseau",
    score: 13980, 
    level: 24, 
    streak: 6,
    completedExercises: 79,
    completedCourses: 3,
    badges: 5,
    accuracy: 79,
    memberSince: "Jan 2025",
    lastActive: "Today",
    rank: 10,
    prevRank: 10,
    avatar: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  }
];

// Achievement badges
const achievementBadges = [
  { id: 1, name: "Fondamentaux maîtrisés", description: "Compléter tous les modules fondamentaux", icon: BookOpen },
  { id: 2, name: "Expert en volatilité", description: "Obtenir 100% au quiz sur les structures de volatilité", icon: TrendingUp },
  { id: 3, name: "Survivant", description: "Atteindre la 10ème vague en mode survie", icon: Zap },
  { id: 4, name: "Maître du pricing", description: "Résoudre correctement 50 exercices de pricing", icon: BarChart }
];

// Recent activities
const recentActivities = [
  { 
    id: 1, 
    username: "QuantMaster", 
    action: "a complété le module", 
    target: "Volatilité stochastique",
    time: "Il y a 2 heures",
    points: 250,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  { 
    id: 2, 
    username: "OptionPro", 
    action: "a obtenu le badge", 
    target: "Maître du pricing",
    time: "Il y a 4 heures",
    points: 500,
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  { 
    id: 3, 
    username: "AlgoFinance", 
    action: "a atteint la vague 8 en", 
    target: "Mode survie",
    time: "Il y a 6 heures",
    points: 350,
    avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  }
];

const Leaderboard = () => {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState("global");
  const [sortBy, setSortBy] = useState("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  
  // Handle sorting
  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };
  
  // Filter and sort leaderboard data
  const filteredData = leaderboardData
    .filter(player => player.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    player.realName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "score":
          comparison = a.score - b.score;
          break;
        case "level":
          comparison = a.level - b.level;
          break;
        case "streak":
          comparison = a.streak - b.streak;
          break;
        case "accuracy":
          comparison = a.accuracy - b.accuracy;
          break;
        default:
          comparison = a.score - b.score;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content */}
            <div className="lg:w-2/3">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold terminal-text mb-2">{t('leaderboard.title')}</h1>
                  <p className="text-finance-lightgray">
                    {t('leaderboard.subtitle')}
                  </p>
                </div>
                
                <div className="flex gap-3 mt-4 md:mt-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-finance-lightgray" />
                    <input
                      type="text"
                      placeholder={t('leaderboard.searchPlaceholder')}
                      className="w-full bg-finance-charcoal/30 border border-finance-steel/20 rounded-full pl-10 pr-4 py-2 text-sm text-finance-offwhite placeholder:text-finance-lightgray focus:outline-none focus:border-finance-accent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <button className="finance-button-outline text-sm flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    {t('leaderboard.filter')}
                  </button>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="flex mb-6 overflow-x-auto">
                <button
                  onClick={() => setSelectedTab("global")}
                  className={`px-4 py-2 font-medium text-sm border-b-2 ${
                    selectedTab === "global"
                      ? "border-finance-accent text-finance-offwhite"
                      : "border-transparent text-finance-lightgray hover:text-finance-offwhite"
                  }`}
                >
                  {t('leaderboard.tabs.global')}
                </button>
                <button
                  onClick={() => setSelectedTab("monthly")}
                  className={`px-4 py-2 font-medium text-sm border-b-2 ${
                    selectedTab === "monthly"
                      ? "border-finance-accent text-finance-offwhite"
                      : "border-transparent text-finance-lightgray hover:text-finance-offwhite"
                  }`}
                >
                  {t('leaderboard.tabs.monthly')}
                </button>
                <button
                  onClick={() => setSelectedTab("weekly")}
                  className={`px-4 py-2 font-medium text-sm border-b-2 ${
                    selectedTab === "weekly"
                      ? "border-finance-accent text-finance-offwhite"
                      : "border-transparent text-finance-lightgray hover:text-finance-offwhite"
                  }`}
                >
                  {t('leaderboard.tabs.weekly')}
                </button>
                <button
                  onClick={() => setSelectedTab("survival")}
                  className={`px-4 py-2 font-medium text-sm border-b-2 ${
                    selectedTab === "survival"
                      ? "border-finance-accent text-finance-offwhite"
                      : "border-transparent text-finance-lightgray hover:text-finance-offwhite"
                  }`}
                >
                  {t('leaderboard.tabs.survival')}
                </button>
                <button
                  onClick={() => setSelectedTab("friends")}
                  className={`px-4 py-2 font-medium text-sm border-b-2 ${
                    selectedTab === "friends"
                      ? "border-finance-accent text-finance-offwhite"
                      : "border-transparent text-finance-lightgray hover:text-finance-offwhite"
                  }`}
                >
                  {t('leaderboard.tabs.friends')}
                </button>
              </div>
              
              {/* Top 3 podium */}
              <div className="hidden lg:flex justify-center items-end mb-12 mt-8">
                {filteredData.slice(0, 3).map((player, index) => (
                  <div 
                    key={player.id}
                    className={`flex flex-col items-center ${
                      index === 0 ? 'order-2 mx-6' : index === 1 ? 'order-1' : 'order-3'
                    }`}
                  >
                    <div className="relative">
                      <div 
                        className={`w-16 h-16 sm:w-20 sm:h-20 ${
                          index === 0 ? 'w-20 h-20 sm:w-28 sm:h-28' : ''
                        } rounded-full overflow-hidden border-2 ${
                          index === 0 ? 'border-yellow-400' : index === 1 ? 'border-finance-lightgray' : 'border-amber-700'
                        } mb-2`}
                      >
                        <img 
                          src={player.avatar} 
                          alt={player.username} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div 
                        className={`absolute -top-3 -right-3 p-1.5 rounded-full ${
                          index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-finance-lightgray' : 'bg-amber-700'
                        }`}
                      >
                        <Crown className={`h-4 w-4 ${index === 0 ? 'text-finance-dark' : 'text-finance-dark'}`} />
                      </div>
                    </div>
                    
                    <div className={`text-center ${index === 0 ? '-mt-1' : 'mt-0'}`}>
                      <div 
                        className={`font-bold ${
                          index === 0 ? 'text-lg text-yellow-400' : index === 1 ? 'text-finance-lightgray' : 'text-amber-700'
                        }`}
                      >
                        {index === 0 ? '1er' : index === 1 ? '2ème' : '3ème'}
                      </div>
                      <div className="text-finance-offwhite font-medium">{player.username}</div>
                      <div className="flex items-center justify-center mt-1">
                        <Award className="h-4 w-4 text-finance-accent mr-1" />
                        <span>{player.score.toLocaleString()}</span>
                      </div>
                      <div className="mt-1">
                        <Badge variant="level">Lvl {player.level}</Badge>
                      </div>
                    </div>
                    
                    <div 
                      className={`h-28 sm:h-40 w-20 sm:w-28 rounded-t-lg ${
                        index === 0 
                          ? 'bg-gradient-to-t from-yellow-900/30 to-yellow-400/30 h-40 sm:h-56'
                          : index === 1
                            ? 'bg-gradient-to-t from-finance-steel/30 to-finance-lightgray/30'
                            : 'bg-gradient-to-t from-amber-900/30 to-amber-700/30'
                      }`}
                    ></div>
                  </div>
                ))}
              </div>
              
              {/* Leaderboard table */}
              <div className="finance-card overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-finance-charcoal/50 border-b border-finance-steel/10">
                    <tr>
                      <th className="px-4 py-3 text-sm font-medium">{t('leaderboard.table.rank')}</th>
                      <th className="px-4 py-3 text-sm font-medium">{t('leaderboard.table.player')}</th>
                      <th 
                        className="px-4 py-3 text-sm font-medium text-right cursor-pointer"
                        onClick={() => toggleSort("score")}
                      >
                        <div className="flex items-center justify-end">
                          <span>{t('leaderboard.table.score')}</span>
                          {sortBy === "score" && (
                            sortOrder === "desc" ? 
                              <ArrowDown className="ml-1 h-3 w-3" /> : 
                              <ArrowUp className="ml-1 h-3 w-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-sm font-medium text-right cursor-pointer hidden md:table-cell"
                        onClick={() => toggleSort("level")}
                      >
                        <div className="flex items-center justify-end">
                          <span>{t('leaderboard.table.level')}</span>
                          {sortBy === "level" && (
                            sortOrder === "desc" ? 
                              <ArrowDown className="ml-1 h-3 w-3" /> : 
                              <ArrowUp className="ml-1 h-3 w-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-sm font-medium text-right cursor-pointer hidden lg:table-cell"
                        onClick={() => toggleSort("streak")}
                      >
                        <div className="flex items-center justify-end">
                          <span>{t('leaderboard.table.streak')}</span>
                          {sortBy === "streak" && (
                            sortOrder === "desc" ? 
                              <ArrowDown className="ml-1 h-3 w-3" /> : 
                              <ArrowUp className="ml-1 h-3 w-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-sm font-medium text-right cursor-pointer hidden xl:table-cell"
                        onClick={() => toggleSort("accuracy")}
                      >
                        <div className="flex items-center justify-end">
                          <span>{t('leaderboard.table.accuracy')}</span>
                          {sortBy === "accuracy" && (
                            sortOrder === "desc" ? 
                              <ArrowDown className="ml-1 h-3 w-3" /> : 
                              <ArrowUp className="ml-1 h-3 w-3" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-finance-steel/10">
                    {filteredData.map((player) => (
                      <tr 
                        key={player.id} 
                        className={`hover:bg-finance-steel/5 cursor-pointer ${
                          selectedPlayer?.id === player.id ? 'bg-finance-burgundy/5 border-l-2 border-finance-accent' : ''
                        }`}
                        onClick={() => setSelectedPlayer(player)}
                      >
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center">
                            <div className="mr-2 flex items-center">
                              {player.rank === 1 ? (
                                <div className="bg-yellow-400 text-finance-dark p-1 rounded-full">
                                  <Crown className="h-3 w-3" />
                                </div>
                              ) : player.rank === 2 ? (
                                <div className="bg-finance-lightgray text-finance-dark p-1 rounded-full">
                                  <Medal className="h-3 w-3" />
                                </div>
                              ) : player.rank === 3 ? (
                                <div className="bg-amber-700 text-finance-dark p-1 rounded-full">
                                  <Medal className="h-3 w-3" />
                                </div>
                              ) : (
                                <span className="text-finance-lightgray">#{player.rank}</span>
                              )}
                            </div>
                            
                            {/* Rank change indicator */}
                            {player.rank !== player.prevRank && (
                              <div className="ml-1">
                                {player.rank < player.prevRank ? (
                                  <div className="text-green-400 text-xs flex items-center">
                                    <ArrowUp className="h-3 w-3" />
                                    <span className="ml-0.5">{player.prevRank - player.rank}</span>
                                  </div>
                                ) : (
                                  <div className="text-red-400 text-xs flex items-center">
                                    <ArrowDown className="h-3 w-3" />
                                    <span className="ml-0.5">{player.rank - player.prevRank}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full overflow-hidden mr-3">
                              <img 
                                src={player.avatar} 
                                alt={player.username} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="text-finance-offwhite font-medium">{player.username}</div>
                              <div className="text-finance-lightgray text-xs">{player.realName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-finance-offwhite">
                          {player.score.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right hidden md:table-cell">
                          <Badge variant="level">Lvl {player.level}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-right hidden lg:table-cell">
                          <div className="flex items-center justify-end">
                            <Activity className="h-3 w-3 text-finance-accent mr-1" />
                            <span>{player.streak}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-right hidden xl:table-cell">
                          <div className={`px-2 py-0.5 rounded inline-block ${
                            player.accuracy >= 90 
                              ? 'bg-green-900/20 text-green-400' 
                              : player.accuracy >= 80
                                ? 'bg-blue-900/20 text-blue-400'
                                : 'bg-yellow-900/20 text-yellow-400'
                          }`}>
                            {player.accuracy}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="lg:w-1/3 space-y-6">
              {/* Player details */}
              {selectedPlayer ? (
                <div className="finance-card p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-14 w-14 rounded-full overflow-hidden mr-4">
                      <img 
                        src={selectedPlayer.avatar} 
                        alt={selectedPlayer.username} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-medium text-finance-offwhite">{selectedPlayer.username}</h2>
                      <p className="text-finance-lightgray">{selectedPlayer.realName}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="finance-card bg-finance-charcoal/30 p-3">
                        <div className="text-finance-lightgray text-xs mb-1">{t('leaderboard.playerDetails.rank')}</div>
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 text-finance-accent mr-2" />
                          <span className="text-finance-offwhite font-medium">#{selectedPlayer.rank}</span>
                        </div>
                      </div>
                      <div className="finance-card bg-finance-charcoal/30 p-3">
                        <div className="text-finance-lightgray text-xs mb-1">{t('leaderboard.playerDetails.score')}</div>
                        <div className="flex items-center">
                          <Award className="h-4 w-4 text-finance-accent mr-2" />
                          <span className="text-finance-offwhite font-medium">{selectedPlayer.score.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="finance-card bg-finance-charcoal/30 p-3">
                        <div className="text-finance-lightgray text-xs mb-1">{t('leaderboard.playerDetails.level')}</div>
                        <div className="flex items-center">
                          <BarChart className="h-4 w-4 text-finance-accent mr-2" />
                          <span className="text-finance-offwhite font-medium">{selectedPlayer.level}</span>
                        </div>
                      </div>
                      <div className="finance-card bg-finance-charcoal/30 p-3">
                        <div className="text-finance-lightgray text-xs mb-1">{t('leaderboard.playerDetails.streak')}</div>
                        <div className="flex items-center">
                          <Activity className="h-4 w-4 text-finance-accent mr-2" />
                          <span className="text-finance-offwhite font-medium">{selectedPlayer.streak}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                      <div className="finance-card bg-finance-charcoal/30 p-3">
                        <div className="text-finance-lightgray text-xs mb-1">{t('leaderboard.playerDetails.exercises')}</div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-finance-accent mr-2" />
                          <span className="text-finance-offwhite font-medium">{selectedPlayer.completedExercises}</span>
                        </div>
                      </div>
                      <div className="finance-card bg-finance-charcoal/30 p-3">
                        <div className="text-finance-lightgray text-xs mb-1">{t('leaderboard.playerDetails.courses')}</div>
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 text-finance-accent mr-2" />
                          <span className="text-finance-offwhite font-medium">{selectedPlayer.completedCourses}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="finance-card bg-finance-charcoal/30 p-3">
                      <div className="flex justify-between mb-2">
                        <div className="text-finance-lightgray text-xs">{t('leaderboard.playerDetails.accuracy')}</div>
                        <div className={`text-xs ${
                          selectedPlayer.accuracy >= 90 
                            ? 'text-green-400' 
                            : selectedPlayer.accuracy >= 80
                              ? 'text-blue-400'
                              : 'text-yellow-400'
                        }`}>
                          {selectedPlayer.accuracy}%
                        </div>
                      </div>
                      <div className="h-1.5 bg-finance-steel/20 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            selectedPlayer.accuracy >= 90 
                              ? 'bg-green-400' 
                              : selectedPlayer.accuracy >= 80
                                ? 'bg-blue-400'
                                : 'bg-yellow-400'
                          }`}
                          style={{ width: `${selectedPlayer.accuracy}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row lg:flex-col gap-4">
                      <div className="finance-card bg-finance-charcoal/30 p-3 flex-1">
                        <div className="flex items-center mb-1">
                          <Calendar className="h-4 w-4 text-finance-accent mr-2" />
                          <div className="text-finance-lightgray text-xs">{t('leaderboard.playerDetails.memberSince')}</div>
                        </div>
                        <div className="text-finance-offwhite">{selectedPlayer.memberSince}</div>
                      </div>
                      
                      <div className="finance-card bg-finance-charcoal/30 p-3 flex-1">
                        <div className="flex items-center mb-1">
                          <Clock className="h-4 w-4 text-finance-accent mr-2" />
                          <div className="text-finance-lightgray text-xs">{t('leaderboard.playerDetails.lastActive')}</div>
                        </div>
                        <div className="text-finance-offwhite">{selectedPlayer.lastActive}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-finance-offwhite font-medium mb-2">{t('leaderboard.playerDetails.badges')}</h3>
                      <div className="flex flex-wrap gap-2">
                        {[...Array(selectedPlayer.badges)].map((_, index) => (
                          <div 
                            key={index}
                            className="w-8 h-8 rounded-full bg-finance-burgundy/20 flex items-center justify-center"
                            title={achievementBadges[index % achievementBadges.length].name}
                          >
                            {React.createElement(achievementBadges[index % achievementBadges.length].icon, {
                              className: "h-4 w-4 text-finance-accent"
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="finance-card p-6 text-center">
                  <Award className="h-12 w-12 text-finance-accent mx-auto mb-3 opacity-50" />
                  <h3 className="text-lg font-medium text-finance-offwhite mb-2">{t('leaderboard.selectPlayer')}</h3>
                  <p className="text-finance-lightgray text-sm">
                    {t('leaderboard.selectPlayerDesc')}
                  </p>
                </div>
              )}
              
              {/* Recent activities */}
              <div className="finance-card p-6">
                <h3 className="text-lg font-medium mb-4">{t('leaderboard.recentActivities')}</h3>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start">
                      <div className="h-8 w-8 rounded-full overflow-hidden mr-3">
                        <img 
                          src={activity.avatar} 
                          alt={activity.username} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-finance-offwhite text-sm">
                          <span className="font-medium">{activity.username}</span> {activity.action}{' '}
                          <span className="text-finance-accent">{activity.target}</span>
                        </p>
                        <div className="flex justify-between mt-1">
                          <span className="text-finance-lightgray text-xs">{activity.time}</span>
                          <div className="flex items-center">
                            <Award className="h-3 w-3 text-finance-accent mr-1" />
                            <span className="text-finance-offwhite text-xs">+{activity.points}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Achievement badges */}
              <div className="finance-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">{t('leaderboard.achievementBadges')}</h3>
                  <button className="text-finance-accent text-sm hover:underline">
                    {t('leaderboard.viewAll')}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {achievementBadges.map((badge) => (
                    <div key={badge.id} className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-finance-burgundy/20 flex items-center justify-center mr-3">
                        <badge.icon className="h-5 w-5 text-finance-accent" />
                      </div>
                      <div>
                        <div className="text-finance-offwhite text-sm font-medium">{badge.name}</div>
                        <div className="text-finance-lightgray text-xs">{badge.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Leaderboard;
