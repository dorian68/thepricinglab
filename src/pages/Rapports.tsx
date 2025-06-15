
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileSpreadsheet, Download, FileText, BarChart3, PieChart, Settings } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { safeTranslate } from '../utils/translationUtils';

const Rapports = () => {
  const { t } = useTranslation();
  const { requirePermission } = usePermissions();
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Check permission
  if (!requirePermission('custom_reports')) {
    return null;
  }

  const templates = [
    {
      id: 'pnl-daily',
      name: 'Rapport P&L Journalier',
      description: 'Analyse détaillée des performances quotidiennes',
      icon: BarChart3,
      category: 'Performance'
    },
    {
      id: 'risk-analysis',
      name: 'Analyse des Risques',
      description: 'VaR, stress tests et expositions',
      icon: PieChart,
      category: 'Risque'
    },
    {
      id: 'greeks-exposure',
      name: 'Exposition Greeks',
      description: 'Sensibilités du portefeuille par sous-jacent',
      icon: FileText,
      category: 'Greeks'
    },
    {
      id: 'custom',
      name: 'Rapport Personnalisé',
      description: 'Créer un rapport sur mesure',
      icon: Settings,
      category: 'Custom'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Générateur de Rapports | The Pricing Library</title>
        <meta name="description" content="Génération de rapports personnalisés pour l'analyse de portefeuilles d'options" />
      </Helmet>
      
      <div className="min-h-screen bg-finance-dark text-finance-offwhite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-finance-accent">
                {safeTranslate(t, 'rapports.title', 'Générateur de Rapports')}
              </h1>
              <Badge variant="premium">PRO</Badge>
            </div>
            <p className="text-finance-lightgray text-lg">
              Créez des rapports professionnels personnalisés pour vos analyses quantitatives
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template Selection */}
            <div className="lg:col-span-1">
              <Card className="finance-card">
                <CardHeader>
                  <CardTitle>Modèles de Rapports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {templates.map((template) => {
                      const IconComponent = template.icon;
                      return (
                        <button
                          key={template.id}
                          onClick={() => setSelectedTemplate(template.id)}
                          className={`w-full text-left p-4 rounded-lg border transition-colors ${
                            selectedTemplate === template.id
                              ? 'border-finance-accent bg-finance-accent/10'
                              : 'border-finance-steel/20 hover:border-finance-accent/50'
                          }`}
                        >
                          <div className="flex items-start">
                            <IconComponent className="h-5 w-5 mr-3 mt-1 text-finance-accent" />
                            <div className="flex-1">
                              <div className="font-medium">{template.name}</div>
                              <div className="text-xs text-finance-lightgray mt-1">
                                {template.description}
                              </div>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {template.category}
                              </Badge>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Report Configuration */}
            <div className="lg:col-span-2">
              {selectedTemplate ? (
                <Card className="finance-card">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Configuration du Rapport
                      <Button size="sm" variant="financeOutline">
                        <Download className="h-4 w-4 mr-2" />
                        Aperçu
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* General Settings */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Titre du Rapport</label>
                        <Input
                          placeholder="Ex: Analyse P&L - Portfolio Principal"
                          className="w-full"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Date de début</label>
                          <Input type="date" className="w-full" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Date de fin</label>
                          <Input type="date" className="w-full" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Portefeuille</label>
                        <select className="w-full bg-finance-charcoal border border-finance-steel/20 rounded px-3 py-2">
                          <option value="">Sélectionnez un portefeuille</option>
                          <option value="main">Portfolio Principal</option>
                          <option value="hedge">Portfolio Hedge</option>
                          <option value="trading">Portfolio Trading</option>
                        </select>
                      </div>
                    </div>

                    {/* Template-specific Settings */}
                    {selectedTemplate === 'pnl-daily' && (
                      <div className="space-y-4 border-t border-finance-steel/20 pt-4">
                        <h3 className="font-medium">Options P&L</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm">Décomposition par sous-jacent</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm">Graphiques d'évolution</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">Attribution des sources</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">Comparaison benchmarks</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {selectedTemplate === 'risk-analysis' && (
                      <div className="space-y-4 border-t border-finance-steel/20 pt-4">
                        <h3 className="font-medium">Métriques de Risque</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm">VaR (95%, 99%)</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm">Expected Shortfall</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">Stress Tests</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">Scénarios de marché</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {selectedTemplate === 'custom' && (
                      <div className="space-y-4 border-t border-finance-steel/20 pt-4">
                        <h3 className="font-medium">Sections Personnalisées</h3>
                        <Textarea
                          placeholder="Décrivez les sections et analyses que vous souhaitez inclure dans votre rapport..."
                          rows={4}
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6 border-t border-finance-steel/20">
                      <Button className="flex-1">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Générer PDF
                      </Button>
                      <Button variant="financeOutline" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Exporter Excel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="finance-card">
                  <CardContent className="text-center py-12">
                    <FileSpreadsheet className="h-16 w-16 text-finance-lightgray mx-auto mb-4" />
                    <p className="text-finance-lightgray text-lg mb-2">
                      Sélectionnez un modèle de rapport
                    </p>
                    <p className="text-sm text-finance-lightgray">
                      Choisissez un modèle dans la liste pour commencer la configuration
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Rapports;
