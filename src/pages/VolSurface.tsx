
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Settings, Download, Eye } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { safeTranslate } from '../utils/translationUtils';

const VolSurface = () => {
  const { t } = useTranslation();
  const { requirePermission } = usePermissions();
  const [spotPrice, setSpotPrice] = useState([100]);
  const [timeToExpiry, setTimeToExpiry] = useState([0.25]);
  const [riskFreeRate, setRiskFreeRate] = useState([0.05]);
  const [selectedModel, setSelectedModel] = useState('black-scholes');

  // Check permission
  if (!requirePermission('vol_surface')) {
    return null;
  }

  const models = [
    { id: 'black-scholes', name: 'Black-Scholes', description: 'Volatilité constante' },
    { id: 'local-vol', name: 'Local Volatility', description: 'Volatilité locale dépendante du spot et du temps' },
    { id: 'heston', name: 'Heston', description: 'Volatilité stochastique' },
    { id: 'sabr', name: 'SABR', description: 'Modèle de volatilité stochastique avec smile' }
  ];

  return (
    <>
      <Helmet>
        <title>Surface de Volatilité | The Pricing Library</title>
        <meta name="description" content="Visualisation interactive des surfaces de volatilité avec différents modèles" />
      </Helmet>
      
      <div className="min-h-screen bg-finance-dark text-finance-offwhite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-finance-accent">
                {safeTranslate(t, 'volSurface.title', 'Surface de Volatilité')}
              </h1>
              <Badge variant="premium">PRO</Badge>
            </div>
            <p className="text-finance-lightgray text-lg">
              Explorez et analysez les surfaces de volatilité avec des modèles avancés
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Controls Panel */}
            <div className="lg:col-span-1">
              <Card className="finance-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Paramètres
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Model Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Modèle</label>
                    <div className="space-y-2">
                      {models.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => setSelectedModel(model.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedModel === model.id
                              ? 'border-finance-accent bg-finance-accent/10'
                              : 'border-finance-steel/20 hover:border-finance-accent/50'
                          }`}
                        >
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-finance-lightgray">{model.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Parameters */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Prix du sous-jacent: ${spotPrice[0]}
                    </label>
                    <Slider
                      value={spotPrice}
                      onValueChange={setSpotPrice}
                      max={200}
                      min={50}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Temps à l'échéance: {timeToExpiry[0]} ans
                    </label>
                    <Slider
                      value={timeToExpiry}
                      onValueChange={setTimeToExpiry}
                      max={2}
                      min={0.1}
                      step={0.05}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Taux sans risque: {(riskFreeRate[0] * 100).toFixed(1)}%
                    </label>
                    <Slider
                      value={riskFreeRate}
                      onValueChange={setRiskFreeRate}
                      max={0.1}
                      min={0}
                      step={0.005}
                      className="w-full"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="financeOutline" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Prévisualiser
                    </Button>
                    <Button size="sm" variant="financeOutline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Visualization Panel */}
            <div className="lg:col-span-2">
              <Card className="finance-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Visualisation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="3d" className="w-full">
                    <TabsList className="grid grid-cols-3 mb-6 bg-finance-charcoal">
                      <TabsTrigger value="3d" className="data-[state=active]:bg-finance-burgundy">
                        Surface 3D
                      </TabsTrigger>
                      <TabsTrigger value="heatmap" className="data-[state=active]:bg-finance-burgundy">
                        Heatmap
                      </TabsTrigger>
                      <TabsTrigger value="slices" className="data-[state=active]:bg-finance-burgundy">
                        Coupes
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="3d" className="space-y-4">
                      <div className="bg-finance-charcoal rounded-lg p-6 h-96 flex items-center justify-center">
                        <div className="text-center">
                          <TrendingUp className="h-16 w-16 text-finance-accent mx-auto mb-4" />
                          <p className="text-finance-lightgray">
                            Surface de volatilité 3D pour le modèle {models.find(m => m.id === selectedModel)?.name}
                          </p>
                          <p className="text-sm text-finance-lightgray mt-2">
                            Spot: ${spotPrice[0]} | Échéance: {timeToExpiry[0]}a | Taux: {(riskFreeRate[0] * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="heatmap" className="space-y-4">
                      <div className="bg-finance-charcoal rounded-lg p-6 h-96 flex items-center justify-center">
                        <div className="text-center">
                          <div className="grid grid-cols-8 gap-1 mb-4">
                            {Array.from({ length: 64 }, (_, i) => (
                              <div
                                key={i}
                                className="w-6 h-6 rounded"
                                style={{
                                  backgroundColor: `hsl(${240 + (i % 8) * 15}, 70%, ${30 + (Math.floor(i / 8) * 8)}%)`
                                }}
                              />
                            ))}
                          </div>
                          <p className="text-finance-lightgray">Heatmap de volatilité implicite</p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="slices" className="space-y-4">
                      <div className="bg-finance-charcoal rounded-lg p-6 h-96 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-full h-32 bg-gradient-to-r from-finance-burgundy/20 to-finance-accent/20 rounded mb-4 flex items-center justify-center">
                            <span className="text-finance-lightgray">Coupes de volatilité par maturité</span>
                          </div>
                          <p className="text-finance-lightgray">Smile de volatilité à différentes échéances</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VolSurface;
