
import React from "react";
import { useTranslation } from "react-i18next";
import { Bug, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const BugReport = () => {
  const { t } = useTranslation();

  return (
    <main className="py-10 px-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 flex items-center terminal-text">
            <Bug className="mr-3 h-7 w-7 text-finance-accent" /> Signaler un bug
          </h1>
          <p className="text-finance-lightgray text-lg">
            Aidez-nous à améliorer The Trading Lab en signalant les problèmes que vous rencontrez.
          </p>
        </header>
        
        <div className="finance-card p-6">
          <form className="space-y-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-2">
                Catégorie du bug
              </label>
              <select
                id="category"
                className="w-full p-3 bg-finance-charcoal rounded border border-finance-steel/20 focus:border-finance-accent focus:ring-1 focus:ring-finance-accent"
              >
                <option value="">Sélectionnez une catégorie</option>
                <option value="ui">Interface utilisateur</option>
                <option value="functionality">Fonctionnalité</option>
                <option value="performance">Performance</option>
                <option value="course-content">Contenu du cours</option>
                <option value="other">Autre</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Titre du bug
              </label>
              <input
                type="text"
                id="title"
                placeholder="Décrivez brièvement le problème"
                className="w-full p-3 bg-finance-charcoal rounded border border-finance-steel/20 focus:border-finance-accent focus:ring-1 focus:ring-finance-accent"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description détaillée
              </label>
              <textarea
                id="description"
                rows={5}
                placeholder="Décrivez en détail le bug, les étapes pour le reproduire et le comportement attendu"
                className="w-full p-3 bg-finance-charcoal rounded border border-finance-steel/20 focus:border-finance-accent focus:ring-1 focus:ring-finance-accent"
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="url" className="block text-sm font-medium mb-2">
                URL où le bug se produit
              </label>
              <input
                type="text"
                id="url"
                placeholder="https://..."
                className="w-full p-3 bg-finance-charcoal rounded border border-finance-steel/20 focus:border-finance-accent focus:ring-1 focus:ring-finance-accent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Capture d'écran (optionnel)
              </label>
              <div className="border-2 border-dashed border-finance-steel/30 rounded p-6 text-center">
                <p className="text-finance-lightgray mb-2">Glissez-déposez une image ou</p>
                <Button type="button" variant="outline" size="sm">
                  Parcourir les fichiers
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full flex items-center justify-center">
              <Send className="mr-2 h-4 w-4" /> Envoyer le rapport
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default BugReport;
