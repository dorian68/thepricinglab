
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import PythonActivator from '@/utils/pythonActivator';

/**
 * Simplified placeholder for the Monte Carlo Simulator
 * This version will display properly while we repair the full implementation
 */
const MonteCarloSimulator: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Monte Carlo Simulator | The Pricing Lab</title>
      </Helmet>
      
      <h1 className="text-3xl font-bold mb-6">Monte Carlo Simulator</h1>
      
      <PythonActivator autoLoad={true} discreet={true} />
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Maintenance en cours</CardTitle>
          <CardDescription>
            Le simulateur Monte Carlo est en cours de maintenance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Simulateur temporairement indisponible
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Notre équipe travaille activement sur la résolution de problèmes techniques avec le simulateur Monte Carlo.
              Cette fonctionnalité sera de nouveau disponible très prochainement.
            </p>
            <p className="text-sm text-gray-400">
              Les données de simulation sont préservées et seront restaurées dès la reprise du service.
            </p>
            
            <Button 
              variant="outline" 
              className="mt-6"
              onClick={() => window.history.back()}
            >
              Retour aux outils
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-sm text-gray-500 mt-8">
        <p>
          <strong>À propos du simulateur Monte Carlo :</strong> Cet outil permet de simuler l'évolution des prix d'actifs 
          financiers selon différents modèles stochastiques (mouvement brownien géométrique, diffusion avec sauts) 
          et de calculer des métriques de risque comme la Value-at-Risk (VaR).
        </p>
      </div>
    </div>
  );
};

export default MonteCarloSimulator;
