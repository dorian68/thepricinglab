
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MarketVisuals from "../components/MarketVisuals";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col min-h-screen bg-[#1A1F2C] text-white">
      <Navbar />
      
      {/* Animated background canvas */}
      <MarketVisuals />
      
      {/* Hero Section */}
      <section className="relative py-20 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Prépare-toi <span className="text-[#ea384c]">à entrer</span><br />
                dans la <span className="text-[#ea384c]">salle des marchés.</span>
              </h1>
              
              <p className="text-[#8E9196] text-lg mt-6 mb-8">
                Formation d'élite destinée aux étudiants en finance qui souhaitent maîtriser les méthodes de pricing utilisées quotidiennement par les professionnels.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/courses" className="bg-[#ea384c] hover:bg-red-700 text-white font-medium py-3 px-6 rounded transition-colors duration-200 text-center">
                  Commencer le parcours
                </Link>
                <Link to="/signup" className="border border-[#ea384c] text-[#ea384c] hover:bg-red-600/10 font-medium py-3 px-6 rounded transition-colors duration-200 text-center">
                  S'inscrire maintenant
                </Link>
              </div>
              
              <div className="mt-8">
                <span className="font-mono text-[#ea384c] tracking-wider text-sm font-medium">MAÎTRISE. TECHNIQUE. MARCHÉS.</span>
              </div>
            </div>
            
            <div className="relative aspect-[4/3] bg-black/60 rounded-lg overflow-hidden">
              <div className="bg-[url('/lovable-uploads/bf767635-7fdf-4661-88ea-ecfb8f95eb5d.png')] bg-cover bg-center w-full h-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="font-mono text-[#ea384c] bg-black/80 px-4 py-3 border border-red-900/30 rounded text-sm tracking-wider">
                  TRADING TERMINAL ACTIVATED
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
