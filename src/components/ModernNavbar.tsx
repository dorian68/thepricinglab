
import { useState } from "react";
import { Menu } from "lucide-react";
import DesktopNav from "./navigation/DesktopNav";
import MobileNav from "./navigation/MobileNav";

const ModernNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-finance-dark/95 backdrop-blur-sm border-b border-finance-steel/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <DesktopNav />
          
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-finance-offwhite hover:text-finance-accent focus:outline-none"
            >
              <span className="sr-only">Open menu</span>
              <Menu className="block h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <MobileNav isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </nav>
  );
};

export default ModernNavbar;
