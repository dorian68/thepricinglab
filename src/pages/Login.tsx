
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ici, normalement, la logique d'authentification
    console.log("Tentative de connexion:", { email, password });
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold terminal-text">Connexion</h1>
            <p className="text-finance-lightgray mt-2">
              Accédez à votre espace d'apprentissage
            </p>
          </div>
          
          <div className="finance-card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-finance-lightgray text-sm mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-finance-dark border border-finance-steel/30 rounded p-3 text-finance-offwhite"
                  placeholder="votre@email.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-finance-lightgray text-sm mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-finance-dark border border-finance-steel/30 rounded p-3 text-finance-offwhite pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-finance-lightgray"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <Link to="/reset-password" className="text-finance-accent text-sm hover:underline">
                    Mot de passe oublié?
                  </Link>
                </div>
              </div>
              
              <button
                type="submit"
                className="finance-button w-full"
              >
                Se connecter
              </button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-finance-steel/20 text-center">
              <p className="text-finance-lightgray text-sm">
                Pas encore de compte? {" "}
                <Link to="/signup" className="text-finance-accent hover:underline">
                  S'inscrire
                </Link>
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center text-finance-lightgray text-sm">
            <p>
              En vous connectant, vous acceptez nos {" "}
              <Link to="/terms" className="text-finance-accent hover:underline">
                conditions d'utilisation
              </Link>
              {" "} et notre {" "}
              <Link to="/privacy" className="text-finance-accent hover:underline">
                politique de confidentialité
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Login;
