
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Upload, Download, Calculator, BarChart3, Settings } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { safeTranslate } from '../utils/translationUtils';

const QuantProTools = () => {
  const { t } = useTranslation();
  const { requirePermission } = usePermissions();

  // Check permission
  if (!requirePermission('quant_pro_tools')) {
    return null;
  }

  const pricingModels = [
    { id: 'black-scholes', name: 'Black-Scholes', description: 'Modèle classique européen' },
    { id: 'heston', name: 'Heston', description: 'Volatilité stochastique' },
    { id: 'sabr', name: 'SABR', description: 'Smile de volatilité' },
    { id: 'local-vol', name: 'Local Vol', description: 'Volatilité locale' },
    { id: 'jump-diffusion', name: 'Jump-Diffusion', description: 'Modèle avec sauts' }
  ];

  return (
    <>
      <Helmet>
        <title>Quant PRO Tools | The Pricing Library</title>
        <meta name="description" content="Outils professionnels de pricing et d'analyse quantitative pour hedge funds et family offices" />
      </Helmet>
      
      <div className="min-h-screen bg-finance-dark text-finance-offwhite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-finance-accent">
                {safeTranslate(t, 'quantProTools.title', 'Quant PRO Tools')}
              </h1>
              <Badge variant="premium">PRO</Badge>
            </div>
            <p className="text-finance-lightgray text-lg">
              Suite d'outils professionnels pour le pricing en temps réel et l'analyse de portefeuilles
            </p>
          </div>

          <Tabs defaultValue="live-pricing" className="w-full">
            <TabsList className="grid grid-cols-4 mb-6 bg-finance-charcoal">
              <TabsTrigger value="live-pricing" className="data-[state=active]:bg-finance-burgundy">
                <Calculator className="h-4 w-4 mr-2" />
                Pricing Live
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="data-[state=active]:bg-finance-burgundy">
                <Upload className="h-4 w-4 mr-2" />
                Portefeuille
              </TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-finance-burgundy">
                <BarChart3 className="h-4 w-4 mr-2" />
                Rapports
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-finance-burgundy">
                <Activity className="h-4 w-4 mr-2" />
                Historique
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live-pricing" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="finance-card">
                  <CardHeader>
                    <CardTitle>Configuration de Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Modèle de Pricing</label>
                      <select className="w-full bg-finance-charcoal border border-finance-steel/20 rounded px-3 py-2">
                        {pricingModels.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name} - {model.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Spot Price</label>
                        <input
                          type="number"
                          className="w-full bg-finance-charcoal border border-finance-steel/20 rounded px-3 py-2"
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Strike</label>
                        <input
                          type="number"
                          className="w-full bg-finance-charcoal border border-finance-steel/20 rounded px-3 py-2"
                          placeholder="105"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Volatilité</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full bg-finance-charcoal border border-finance-steel/20 rounded px-3 py-2"
                          placeholder="0.25"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Taux</label>
                        <input
                          type="number"
                          step="0.001"
                          className="w-full bg-finance-charcoal border border-finance-steel/20 rounded px-3 py-2"
                          placeholder="0.05"
                        />
                      </div>
                    </div>

                    <Button className="w-full">
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculer Prix
                    </Button>
                  </CardContent>
                </Card>

                <Card className="finance-card">
                  <CardHeader>
                    <CardTitle>Résultats de Pricing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-finance-accent mb-2">$4.76</div>
                        <div className="text-sm text-finance-lightgray">Prix de l'option</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-finance-charcoal rounded p-3">
                          <div className="text-lg font-semibold">0.642</div>
                          <div className="text-xs text-finance-lightgray">Delta</div>
                        </div>
                        <div className="bg-finance-charcoal rounded p-3">
                          <div className="text-lg font-semibold">0.028</div>
                          <div className="text-xs text-finance-lightgray">Gamma</div>
                        </div>
                        <div className="bg-finance-charcoal rounded p-3">
                          <div className="text-lg font-semibold">-0.012</div>
                          <div className="text-xs text-finance-lightgray">Theta</div>
                        </div>
                        <div className="bg-finance-charcoal rounded p-3">
                          <div className="text-lg font-semibold">18.45</div>
                          <div className="text-xs text-finance-lightgray">Vega</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="portfolio" className="space-y-6">
              <Card className="finance-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Analyse de Portefeuille
                    <Button size="sm" variant="financeOutline">
                      <Upload className="h-4 w-4 mr-2" />
                      Importer CSV
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Upload className="h-16 w-16 text-finance-lightgray mx-auto mb-4" />
                    <p className="text-finance-lightgray mb-4">
                      Importez votre portefeuille d'options au format CSV
                    </p>
                    <p className="text-sm text-finance-lightgray">
                      Format attendu: Symbol, Type, Strike, Expiry, Quantity, Side
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="finance-card">
                  <CardHeader>
                    <CardTitle>Rapport P&L</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400 mb-1">+$12,450</div>
                        <div className="text-sm text-finance-lightgray">P&L journalier</div>
                      </div>
                      <Button size="sm" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Exporter PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="finance-card">
                  <CardHeader>
                    <CardTitle>Analyse des Risques</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">VaR (95%)</span>
                          <span className="text-sm font-medium">$8,750</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Max Drawdown</span>
                          <span className="text-sm font-medium">-$15,200</span>
                        </div>
                      </div>
                      <Button size="sm" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Rapport Complet
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="finance-card">
                  <CardHeader>
                    <CardTitle>Exposition Greeks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Delta Net</span>
                          <span className="text-sm font-medium">+142.5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Gamma Net</span>
                          <span className="text-sm font-medium">-0.85</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Vega Net</span>
                          <span className="text-sm font-medium">+1,250</span>
                        </div>
                      </div>
                      <Button size="sm" className="w-full">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card className="finance-card">
                <CardHeader>
                  <CardTitle>Historique des Calculs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <Activity className="h-16 w-16 text-finance-lightgray mx-auto mb-4" />
                      <p className="text-finance-lightgray">
                        L'historique de vos calculs apparaîtra ici
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default QuantProTools;
