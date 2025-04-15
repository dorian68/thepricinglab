
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { Calendar, Clock, Users, ArrowRight, CheckCircle2, Star, Award, MessageSquare } from "lucide-react";

// Coach Card Component
interface CoachProps {
  name: string;
  role: string;
  company: string;
  description: string;
  specialties: string[];
  rating: number;
  sessions: number;
  available: boolean;
  imagePath?: string;
}

const CoachCard = ({
  name,
  role,
  company,
  description,
  specialties,
  rating,
  sessions,
  available,
  imagePath = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80"
}: CoachProps) => (
  <div className="finance-card p-6">
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-32 flex-shrink-0">
        <div className="aspect-square rounded-md overflow-hidden">
          <img 
            src={imagePath} 
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      
      <div className="flex-grow">
        <div className="flex flex-col md:flex-row justify-between md:items-start mb-3">
          <div>
            <h3 className="text-lg font-medium text-finance-offwhite">{name}</h3>
            <p className="text-finance-lightgray text-sm">{role} - {company}</p>
          </div>
          
          <div className="flex items-center mt-2 md:mt-0">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 mr-1" />
              <span className="text-finance-offwhite mr-1">{rating}</span>
              <span className="text-finance-lightgray text-xs">({sessions} sessions)</span>
            </div>
            
            {available ? (
              <span className="ml-3 text-xs px-2 py-0.5 bg-green-900/20 text-green-400 rounded-full">
                Disponible
              </span>
            ) : (
              <span className="ml-3 text-xs px-2 py-0.5 bg-finance-steel/20 text-finance-lightgray rounded-full">
                Liste d'attente
              </span>
            )}
          </div>
        </div>
        
        <p className="text-finance-lightgray text-sm mb-4">
          {description}
        </p>
        
        <div className="mb-4">
          <p className="text-sm font-medium text-finance-offwhite mb-2">Spécialités:</p>
          <div className="flex flex-wrap gap-2">
            {specialties.map((specialty, index) => (
              <span key={index} className="text-xs px-2 py-1 bg-finance-burgundy/10 text-finance-accent rounded-full">
                {specialty}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Link 
            to={`/mentoring/coach/${name.toLowerCase().replace(/\s+/g, '-')}`}
            className="finance-button text-center flex-1"
          >
            Voir le profil
          </Link>
          <button 
            className={`text-center flex-1 ${
              available 
                ? "finance-button-outline" 
                : "border border-finance-steel/30 text-finance-lightgray cursor-not-allowed"
            }`}
          >
            {available ? "Réserver une session" : "Rejoindre la liste d'attente"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Mentoring Package Card
interface PackageProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

const PackageCard = ({
  title,
  price,
  description,
  features,
  recommended = false
}: PackageProps) => (
  <div className={`finance-card p-6 relative ${recommended ? "border-finance-accent" : ""}`}>
    {recommended && (
      <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
        <span className="bg-finance-accent text-finance-offwhite text-xs px-2 py-1 rounded-sm">
          RECOMMANDÉ
        </span>
      </div>
    )}
    
    <h3 className="text-xl font-medium text-finance-offwhite mb-2">{title}</h3>
    <div className="mb-4">
      <span className="text-2xl font-bold text-finance-offwhite">{price}</span>
      {price !== "Sur mesure" && <span className="text-finance-lightgray ml-1">/mois</span>}
    </div>
    
    <p className="text-finance-lightgray text-sm mb-6">{description}</p>
    
    <div className="mb-6 space-y-3">
      {features.map((feature, index) => (
        <div key={index} className="flex items-start">
          <CheckCircle2 className="h-5 w-5 text-finance-accent mr-2 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-finance-lightgray">{feature}</span>
        </div>
      ))}
    </div>
    
    <Link to="/signup" className="finance-button block w-full text-center">
      Commencer
    </Link>
  </div>
);

// Testimonial Component
const Testimonial = ({ 
  quote, 
  author, 
  role, 
  imagePath = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80"
}: { 
  quote: string; 
  author: string; 
  role: string; 
  imagePath?: string;
}) => (
  <div className="finance-card p-6">
    <div className="flex items-start mb-4">
      <Star className="h-4 w-4 text-yellow-400" />
      <Star className="h-4 w-4 text-yellow-400" />
      <Star className="h-4 w-4 text-yellow-400" />
      <Star className="h-4 w-4 text-yellow-400" />
      <Star className="h-4 w-4 text-yellow-400" />
    </div>
    
    <p className="text-finance-lightgray italic mb-6">
      "{quote}"
    </p>
    
    <div className="flex items-center">
      <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
        <img 
          src={imagePath} 
          alt={author}
          className="w-full h-full object-cover"
        />
      </div>
      <div>
        <p className="text-finance-offwhite font-medium">{author}</p>
        <p className="text-finance-lightgray text-sm">{role}</p>
      </div>
    </div>
  </div>
);

const Mentoring = () => {
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      {/* Mentoring Header */}
      <header className="py-12 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 terminal-text">Mentorat & Coaching</h1>
            <p className="text-finance-lightgray text-lg max-w-2xl mx-auto">
              Accélérez votre progression avec l'accompagnement personnalisé de professionnels
              des marchés financiers et préparez-vous efficacement aux entretiens d'embauche.
            </p>
          </div>
        </div>
      </header>
      
      {/* How It Works Section */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center terminal-text">Comment ça fonctionne</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-finance-burgundy/20 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-7 w-7 text-finance-accent" />
              </div>
              <h3 className="text-lg font-medium mb-3">1. Réservez une session</h3>
              <p className="text-finance-lightgray text-sm">
                Choisissez un mentor qui correspond à vos objectifs et trouvez un créneau qui vous convient.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-finance-burgundy/20 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-7 w-7 text-finance-accent" />
              </div>
              <h3 className="text-lg font-medium mb-3">2. Définissez vos objectifs</h3>
              <p className="text-finance-lightgray text-sm">
                Avant la session, partagez vos attentes et questions spécifiques pour que le mentor se prépare.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-finance-burgundy/20 flex items-center justify-center mx-auto mb-4">
                <Award className="h-7 w-7 text-finance-accent" />
              </div>
              <h3 className="text-lg font-medium mb-3">3. Progressez concrètement</h3>
              <p className="text-finance-lightgray text-sm">
                Bénéficiez d'un retour personnalisé, d'exercices sur mesure et d'un suivi de votre progression.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Coaches Section */}
      <section className="py-12 px-6 bg-finance-charcoal/20 border-y border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2 terminal-text">Nos mentors</h2>
              <p className="text-finance-lightgray max-w-2xl">
                Des professionnels sélectionnés avec soin pour leur expertise technique et leur qualité pédagogique.
              </p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <div className="inline-flex items-center px-3 py-1.5 bg-finance-burgundy/10 rounded-full">
                <Users className="h-4 w-4 text-finance-accent mr-2" />
                <span className="text-finance-lightgray text-sm">16 mentors disponibles</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <CoachCard
              name="Alexandre Dubois"
              role="Quantitative Trader"
              company="BNP Paribas"
              description="8 ans d'expérience en trading d'options sur indices. Spécialiste des stratégies de volatilité et de l'implémentation d'algorithmes de pricing."
              specialties={["Volatilité", "Options", "Python", "C++"]}
              rating={4.9}
              sessions={73}
              available={true}
            />
            
            <CoachCard
              name="Sophie Mercier"
              role="Structurer"
              company="Société Générale"
              description="Experte en structuration de produits dérivés. J'aide les étudiants à comprendre les subtilités du pricing et les enjeux business des salles de marché."
              specialties={["Structuration", "Dérivés Exotiques", "Autocalls"]}
              rating={4.8}
              sessions={51}
              available={true}
              imagePath="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80"
            />
            
            <CoachCard
              name="Thomas Laurent"
              role="Risk Manager"
              company="JP Morgan"
              description="Ancien trader devenu risk manager. Je partage mon expérience sur la gestion des risques de marché et les carrières dans le secteur bancaire."
              specialties={["Risque", "Validation modèles", "Réglementation"]}
              rating={4.7}
              sessions={38}
              available={false}
            />
            
            <CoachCard
              name="Marie Lefevre"
              role="Quant Researcher"
              company="Crédit Agricole"
              description="PhD en mathématiques financières. Mon approche pédagogique allie rigueur théorique et applications pratiques pour les dérivés complexes."
              specialties={["Quant Research", "Modèles stochastiques", "Calibration"]}
              rating={4.9}
              sessions={42}
              available={true}
              imagePath="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80"
            />
          </div>
          
          <div className="text-center mt-8">
            <Link to="/mentoring/all-coaches" className="finance-button-outline inline-flex items-center">
              Voir tous les mentors <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Packages Section */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-4 terminal-text">Nos formules de mentorat</h2>
            <p className="text-finance-lightgray max-w-2xl mx-auto">
              Choisissez la formule qui correspond le mieux à vos objectifs et à votre niveau d'engagement.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PackageCard
              title="Essentiel"
              price="49€"
              description="Pour les étudiants qui cherchent une aide ponctuelle ou un déblocage sur un sujet précis."
              features={[
                "1 session individuelle par mois",
                "Accès au forum communautaire",
                "Vérification de code ou de projets (1/mois)",
                "Support par email"
              ]}
            />
            
            <PackageCard
              title="Premium"
              price="99€"
              description="Pour ceux qui préparent activement leur entrée en salle des marchés. Notre formule la plus populaire."
              features={[
                "2 sessions individuelles par mois",
                "Préparation aux entretiens techniques",
                "Revue de CV et profil LinkedIn",
                "Vérification de code illimitée",
                "Accès prioritaire aux nouveaux mentors"
              ]}
              recommended={true}
            />
            
            <PackageCard
              title="Elite"
              price="Sur mesure"
              description="Pour les professionnels en reconversion ou visant des postes seniors. Un accompagnement intensif."
              features={[
                "Sessions illimitées",
                "Préparation sur mesure",
                "Accès direct aux mentors 24/7",
                "Mock interviews avec feedback",
                "Programme personnalisé",
                "Accompagnement dans négociation salariale"
              ]}
            />
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-12 px-6 bg-finance-charcoal/20 border-t border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center terminal-text">Ce que nos étudiants disent</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Testimonial
              quote="Le mentorat a été décisif dans ma réussite aux entretiens chez GS. Les mock interviews m'ont permis d'anticiper toutes les questions techniques."
              author="Pierre Durand"
              role="Trader Junior, Goldman Sachs"
            />
            
            <Testimonial
              quote="Je stagnais sur mes projets de pricing avant de commencer le mentorat. Mon mentor m'a aidé à structurer mon approche et à maîtriser Python pour la finance."
              author="Emma Bernard"
              role="Étudiante en Master Finance, HEC"
              imagePath="https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80"
            />
            
            <Testimonial
              quote="La revue de mon CV et la préparation aux entretiens techniques ont fait toute la différence. J'ai reçu 3 offres après seulement 2 mois de coaching."
              author="Antoine Moreau"
              role="Quant Developer, Natixis"
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-12 px-6 bg-finance-charcoal/50 border-t border-finance-steel/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 terminal-text">Prêt à accélérer votre carrière?</h2>
          <p className="text-finance-lightgray mb-8">
            Nos programmes de mentorat sont limités en places pour garantir une qualité de suivi optimale. 
            Réservez votre place dès maintenant.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/mentoring/apply" className="finance-button text-center">
              Demander un mentor
            </Link>
            <Link to="/mentoring/all-coaches" className="finance-button-outline text-center">
              Explorer les profils
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Mentoring;
