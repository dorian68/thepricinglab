
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Key, Send, Book, Copy, Eye, Settings } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { safeTranslate } from '../utils/translationUtils';

const ApiDocs = () => {
  const { t } = useTranslation();
  const { requirePermission } = usePermissions();
  const [selectedEndpoint, setSelectedEndpoint] = useState('pricing');

  // Check permission
  if (!requirePermission('api_access')) {
    return null;
  }

  const endpoints = [
    {
      id: 'pricing',
      method: 'POST',
      path: '/api/v1/pricing',
      description: 'Calcule le prix d\'une option avec le modèle spécifié',
      category: 'Pricing'
    },
    {
      id: 'greeks',
      method: 'POST',
      path: '/api/v1/greeks',
      description: 'Calcule les Greeks d\'une option',
      category: 'Pricing'
    },
    {
      id: 'portfolio',
      method: 'POST',
      path: '/api/v1/portfolio/analyze',
      description: 'Analyse un portefeuille d\'options',
      category: 'Portfolio'
    },
    {
      id: 'volatility',
      method: 'GET',
      path: '/api/v1/volatility/{symbol}',
      description: 'Récupère la surface de volatilité',
      category: 'Market Data'
    }
  ];

  const pricingExample = `{
  "model": "black-scholes",
  "option_type": "call",
  "spot_price": 100,
  "strike_price": 105,
  "time_to_expiry": 0.25,
  "risk_free_rate": 0.05,
  "volatility": 0.2
}`;

  const responseExample = `{
  "price": 4.759,
  "greeks": {
    "delta": 0.642,
    "gamma": 0.028,
    "theta": -0.012,
    "vega": 18.45,
    "rho": 6.82
  },
  "model_used": "black-scholes",
  "calculation_time_ms": 12
}`;

  return (
    <>
      <Helmet>
        <title>API Documentation | The Pricing Library</title>
        <meta name="description" content="Documentation de l'API de pricing professionnel pour l'intégration de modèles quantitatifs" />
      </Helmet>
      
      <div className="min-h-screen bg-finance-dark text-finance-offwhite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-finance-accent">
                {safeTranslate(t, 'api.title', 'API Documentation')}
              </h1>
              <Badge variant="premium">PRO</Badge>
            </div>
            <p className="text-finance-lightgray text-lg">
              API REST pour l'intégration de nos modèles de pricing dans vos applications
            </p>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-4 mb-6 bg-finance-charcoal">
              <TabsTrigger value="overview" className="data-[state=active]:bg-finance-burgundy">
                <Book className="h-4 w-4 mr-2" />
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="authentication" className="data-[state=active]:bg-finance-burgundy">
                <Key className="h-4 w-4 mr-2" />
                Authentification
              </TabsTrigger>
              <TabsTrigger value="endpoints" className="data-[state=active]:bg-finance-burgundy">
                <Code className="h-4 w-4 mr-2" />
                Endpoints
              </TabsTrigger>
              <TabsTrigger value="testing" className="data-[state=active]:bg-finance-burgundy">
                <Send className="h-4 w-4 mr-2" />
                Test API
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card className="finance-card">
                <CardHeader>
                  <CardTitle>À propos de l'API</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-finance-lightgray">
                    L'API The Pricing Library vous permet d'intégrer nos modèles de pricing quantitatif 
                    directement dans vos applications, outils de trading ou systèmes de gestion de risque.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-finance-charcoal rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Base URL</h3>
                      <code className="text-sm text-finance-accent">https://api.thepricinglibrary.com</code>
                    </div>
                    <div className="bg-finance-charcoal rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Version</h3>
                      <code className="text-sm text-finance-accent">v1</code>
                    </div>
                    <div className="bg-finance-charcoal rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Format</h3>
                      <code className="text-sm text-finance-accent">JSON</code>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Modèles disponibles</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['Black-Scholes', 'Heston', 'SABR', 'Local Volatility', 'Jump-Diffusion', 'Binomial'].map((model) => (
                        <Badge key={model} variant="outline" className="justify-center py-2">
                          {model}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="authentication" className="space-y-6">
              <Card className="finance-card">
                <CardHeader>
                  <CardTitle>Clés API</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-finance-lightgray">
                    Toutes les requêtes API nécessitent une clé d'authentification dans l'en-tête.
                  </p>
                  
                  <div className="bg-finance-charcoal rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Votre Clé API</h3>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-gray-800 px-3 py-2 rounded text-sm">
                        tpl_sk_live_xxxxxxxxxxxxxxxxxxxx
                      </code>
                      <Button size="sm" variant="financeOutline">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="financeOutline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-finance-charcoal rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Utilisation</h3>
                    <pre className="text-sm overflow-x-auto">
                      <code>{`curl -X POST https://api.thepricinglibrary.com/v1/pricing \\
  -H "Authorization: Bearer tpl_sk_live_xxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '${pricingExample}'`}</code>
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Limites de taux</h3>
                    <ul className="text-sm text-finance-lightgray space-y-1">
                      <li>• 1000 requêtes par minute</li>
                      <li>• 50 000 requêtes par jour</li>
                      <li>• Limitation par clé API</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="endpoints" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="finance-card">
                  <CardHeader>
                    <CardTitle>Endpoints</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {endpoints.map((endpoint) => (
                        <button
                          key={endpoint.id}
                          onClick={() => setSelectedEndpoint(endpoint.id)}
                          className={`w-full text-left p-3 rounded border transition-colors ${
                            selectedEndpoint === endpoint.id
                              ? 'border-finance-accent bg-finance-accent/10'
                              : 'border-finance-steel/20 hover:border-finance-accent/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant={endpoint.method === 'POST' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {endpoint.method}
                            </Badge>
                            <code className="text-sm text-finance-accent">{endpoint.path}</code>
                          </div>
                          <p className="text-xs text-finance-lightgray">{endpoint.description}</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="lg:col-span-2">
                  <Card className="finance-card">
                    <CardHeader>
                      <CardTitle>
                        {endpoints.find(e => e.id === selectedEndpoint)?.path || 'Sélectionnez un endpoint'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedEndpoint === 'pricing' && (
                        <>
                          <div>
                            <h3 className="font-semibold mb-2">Requête</h3>
                            <pre className="bg-finance-charcoal rounded p-4 text-sm overflow-x-auto">
                              <code>{pricingExample}</code>
                            </pre>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2">Réponse</h3>
                            <pre className="bg-finance-charcoal rounded p-4 text-sm overflow-x-auto">
                              <code>{responseExample}</code>
                            </pre>
                          </div>
                        </>
                      )}
                      {selectedEndpoint !== 'pricing' && (
                        <div className="text-center py-8">
                          <Code className="h-16 w-16 text-finance-lightgray mx-auto mb-4" />
                          <p className="text-finance-lightgray">
                            Documentation détaillée pour {endpoints.find(e => e.id === selectedEndpoint)?.path}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="testing" className="space-y-6">
              <Card className="finance-card">
                <CardHeader>
                  <CardTitle>Testeur d'API</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-4">Configuration</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Endpoint</label>
                          <select className="w-full bg-finance-charcoal border border-finance-steel/20 rounded px-3 py-2">
                            <option value="pricing">POST /api/v1/pricing</option>
                            <option value="greeks">POST /api/v1/greeks</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Payload JSON</label>
                          <textarea
                            className="w-full h-32 bg-finance-charcoal border border-finance-steel/20 rounded px-3 py-2 font-mono text-sm"
                            defaultValue={pricingExample}
                          />
                        </div>
                        
                        <Button className="w-full">
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer Requête
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-4">Réponse</h3>
                      <div className="bg-finance-charcoal rounded p-4 h-64 overflow-auto">
                        <pre className="text-sm">
                          <code>{responseExample}</code>
                        </pre>
                      </div>
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

export default ApiDocs;
