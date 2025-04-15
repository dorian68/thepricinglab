
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MarketVisuals from "../components/MarketVisuals";
import { ArrowRight, BarChart, BookOpen, Users, Award, LucideIcon } from "lucide-react";

// Testimonial Component
const Testimonial = ({ quote, author, position }: { quote: string, author: string, position: string }) => (
  <div className="finance-card p-6 flex flex-col justify-between h-full">
    <div>
      <p className="text-finance-lightgray italic mb-4">{quote}</p>
    </div>
    <div>
      <p className="text-finance-offwhite font-medium">{author}</p>
      <p className="text-finance-lightgray text-sm">{position}</p>
    </div>
  </div>
);

// Feature Component
const Feature = ({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: LucideIcon, 
  title: string, 
  description: string 
}) => (
  <div className="flex flex-col items-start p-6 finance-card">
    <div className="bg-finance-burgundy/20 rounded-full p-3 mb-4">
      <Icon className="h-6 w-6 text-finance-accent" />
    </div>
    <h3 className="text-lg font-medium text-finance-offwhite mb-2">{title}</h3>
    <p className="text-finance-lightgray text-sm">{description}</p>
  </div>
);

// Module Preview Component
const ModulePreview = ({ title, level, description }: { title: string, level: string, description: string }) => (
  <div className="finance-card p-6 hover:border-finance-accent transition-colors duration-300 cursor-pointer group">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-lg font-medium text-finance-offwhite">{title}</h3>
      <span className="text-xs px-2 py-1 bg-finance-steel/20 rounded text-finance-lightgray terminal-text">
        {level}
      </span>
    </div>
    <p className="text-finance-lightgray text-sm mb-4">{description}</p>
    <div className="flex justify-end">
      <span className="text-finance-accent flex items-center text-sm font-medium group-hover:translate-x-1 transition-transform duration-300">
        Voir le module <ArrowRight className="ml-1 h-4 w-4" />
      </span>
    </div>
  </div>
);

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      {/* Animated background canvas */}
      <MarketVisuals />
      
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col">
              <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight text-finance-offwhite terminal-text">
                Prépare-toi à entrer dans la<br />
                <span className="finance-gradient text-transparent bg-clip-text">salle des marchés.</span>
              </h1>
              
              <p className="text-finance-lightgray text-lg mb-8">
                Formation d'élite destinée aux étudiants en finance qui souhaitent maîtriser les méthodes 
                de pricing utilisées quotidiennement par les professionnels.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/courses/fundamentals" className="finance-button text-center">
                  Commencer le parcours
                </Link>
                <Link to="/signup" className="finance-button-outline text-center">
                  S'inscrire maintenant
                </Link>
              </div>
              
              <div className="mt-12 flex items-center">
                <span className="terminal-text uppercase tracking-wider text-sm text-finance-accent font-semibold mr-8">
                  MAÎTRISE. TECHNIQUE. MARCHÉS.
                </span>
              </div>
            </div>
            
            <div className="relative aspect-[4/3] bg-finance-charcoal rounded-lg overflow-hidden">
              <div className="bg-[url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3')] bg-cover bg-center w-full h-full opacity-60 mix-blend-overlay"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="terminal-text text-finance-accent bg-finance-charcoal/80 px-4 py-3 border border-finance-burgundy/30 rounded text-sm tracking-wider">
                  TRADING TERMINAL ACTIVATED
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 md:py-24 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 terminal-text">Notre approche pédagogique</h2>
            <p className="text-finance-lightgray max-w-2xl mx-auto">
              Une formation conçue par des professionnels des marchés, pour préparer 
              les futurs talents à exceller dans ce domaine exigeant.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Feature 
              icon={BookOpen} 
              title="Pragmatique" 
              description="Des méthodes et techniques directement applicables en milieu professionnel. Aucune théorie sans application concrète."
            />
            <Feature 
              icon={BarChart} 
              title="Tech-friendly" 
              description="Maîtrise des outils technologiques utilisés en salle des marchés (Python, Excel, Bloomberg, etc)."
            />
            <Feature 
              icon={Users} 
              title="Orientée emploi" 
              description="Notre programme est conçu en collaboration avec des recruteurs pour maximiser votre employabilité."
            />
            <Feature 
              icon={Award} 
              title="Certifiée" 
              description="Obtenez une certification reconnue par les professionnels du secteur, validant vos compétences techniques."
            />
          </div>
        </div>
      </section>
      
      {/* Modules Preview Section */}
      <section className="py-16 md:py-24 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-4 terminal-text">Parcours de formation</h2>
              <p className="text-finance-lightgray max-w-2xl">
                Un programme structuré et progressif pour maîtriser les compétences de pricing essentielles.
              </p>
            </div>
            <Link to="/courses" className="mt-4 md:mt-0 finance-button flex items-center">
              Tous les modules <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ModulePreview 
              title="Black-Scholes & Modèles fondamentaux" 
              level="FONDAMENTAUX" 
              description="Maîtrisez les bases du pricing d'options vanilles et comprenez les hypothèses sous-jacentes aux modèles standards."
            />
            <ModulePreview 
              title="Volatilité implicite & Surfaces" 
              level="VANILLES AVANCÉS" 
              description="Analysez les structures de volatilité, calibrez les modèles et interprétez les signaux de marché."
            />
            <ModulePreview 
              title="Dérivés exotiques & Path-dependent" 
              level="PRODUITS COMPLEXES" 
              description="Techniques de pricing pour options asiatiques, barrières, et produits autocallables."
            />
            <ModulePreview 
              title="Greeks & Stratégies de couverture" 
              level="VANILLES AVANCÉS" 
              description="Gérez le risque de vos positions avec une compréhension approfondie des sensibilités."
            />
            <ModulePreview 
              title="Monte Carlo pour le pricing" 
              level="PRODUITS COMPLEXES" 
              description="Implémentez des simulations Monte Carlo pour valoriser des produits dérivés complexes."
            />
            <ModulePreview 
              title="Stress Testing & Scénarios" 
              level="BONUS" 
              description="Anticipez les mouvements de marché extrêmes et leurs impacts sur vos valorisations."
            />
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 terminal-text">Témoignages</h2>
            <p className="text-finance-lightgray max-w-2xl mx-auto">
              Ce que nos anciens élèves disent après avoir suivi notre formation.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Testimonial 
              quote="J'ai pu intégrer une desk d'equity derivatives grâce aux compétences acquises sur The Pricing Lab. La différence entre cette formation et mes cours théoriques à l'université était frappante."
              author="Alexandre M."
              position="Junior Quant Trader, BNP Paribas"
            />
            <Testimonial 
              quote="L'aspect technique et la rigueur de cette formation m'ont permis de me démarquer lors des entretiens d'embauche. J'ai aujourd'hui une longueur d'avance sur mes collègues sortis d'écoles prestigieuses."
              author="Sarah K."
              position="Risk Analyst, JP Morgan"
            />
            <Testimonial 
              quote="Mon manager a été impressionné par ma capacité à comprendre les mécanismes de pricing dès mon arrivée. Cette formation est un investissement qui a déjà été rentabilisé par mon bonus de première année."
              author="Thomas D."
              position="Structurer, Société Générale"
            />
          </div>
          
          <div className="mt-12 text-center">
            <Link to="/signup" className="finance-button inline-flex items-center">
              Rejoindre la formation <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Subscription CTA */}
      <section className="py-16 px-6 bg-finance-charcoal/50 border-y border-finance-steel/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 terminal-text">Prêt à transformer ta carrière?</h2>
          <p className="text-finance-lightgray mb-8">
            Accès illimité à tous nos modules, outils et challenges pour seulement 19€/mois.
            Investissement minimal, impact maximal sur ton futur professionnel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="finance-button text-center">
              S'abonner pour 19€/mois
            </Link>
            <Link to="/courses" className="finance-button-outline text-center">
              Explorer les modules
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Home;
