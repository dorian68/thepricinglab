
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-finance-dark/95 backdrop-blur-sm border-b border-finance-steel/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="terminal-text text-finance-accent text-xl font-bold">THE PRICING LAB</span>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-4">
                <Link to="/" className="text-finance-offwhite hover:text-finance-accent px-3 py-2 text-sm font-medium">
                  Accueil
                </Link>
                
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="text-finance-offwhite hover:text-finance-accent px-3 py-2 text-sm font-medium flex items-center"
                  >
                    Cours <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  
                  {dropdownOpen && (
                    <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-finance-charcoal ring-1 ring-black ring-opacity-5">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        <Link
                          to="/courses/fundamentals"
                          className="block px-4 py-2 text-sm text-finance-offwhite hover:bg-finance-steel/20"
                          role="menuitem"
                        >
                          Fondamentaux
                        </Link>
                        <Link
                          to="/courses/advanced"
                          className="block px-4 py-2 text-sm text-finance-offwhite hover:bg-finance-steel/20"
                          role="menuitem"
                        >
                          Vanilles avancés
                        </Link>
                        <Link
                          to="/courses/complex"
                          className="block px-4 py-2 text-sm text-finance-offwhite hover:bg-finance-steel/20"
                          role="menuitem"
                        >
                          Produits complexes
                        </Link>
                        <Link
                          to="/courses/bonus"
                          className="block px-4 py-2 text-sm text-finance-offwhite hover:bg-finance-steel/20"
                          role="menuitem"
                        >
                          Bonus
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                
                <Link to="/dashboard" className="text-finance-offwhite hover:text-finance-accent px-3 py-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link to="/projects" className="text-finance-offwhite hover:text-finance-accent px-3 py-2 text-sm font-medium">
                  Projets
                </Link>
                <Link to="/tools" className="text-finance-offwhite hover:text-finance-accent px-3 py-2 text-sm font-medium">
                  Outils
                </Link>
                <Link to="/mentoring" className="text-finance-offwhite hover:text-finance-accent px-3 py-2 text-sm font-medium">
                  Mentorat
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <Link to="/login" className="finance-button-outline mr-4">
                Se connecter
              </Link>
              <Link to="/signup" className="finance-button">
                S'inscrire
              </Link>
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-finance-offwhite hover:text-finance-accent focus:outline-none"
            >
              <span className="sr-only">Ouvrir le menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-finance-charcoal">
            <Link
              to="/"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              Accueil
            </Link>
            <Link
              to="/courses/fundamentals"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              Cours: Fondamentaux
            </Link>
            <Link
              to="/courses/advanced"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              Cours: Vanilles avancés
            </Link>
            <Link
              to="/courses/complex"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              Cours: Produits complexes
            </Link>
            <Link
              to="/dashboard"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              Dashboard
            </Link>
            <Link
              to="/projects"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              Projets
            </Link>
            <Link
              to="/tools"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              Outils
            </Link>
            <Link
              to="/mentoring"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              Mentorat
            </Link>
            <div className="pt-4 pb-3 border-t border-finance-steel/20">
              <Link to="/login" className="finance-button-outline block w-full text-center mb-2">
                Se connecter
              </Link>
              <Link to="/signup" className="finance-button block w-full text-center">
                S'inscrire
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
