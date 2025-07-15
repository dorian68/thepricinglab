import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { LineChart, BarChart } from '@/components/ui/chart';
import { RefreshCw, Download, Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';
import UserModelsSection from './UserModelsSection';
import { safeTranslate } from '@/utils/translationUtils';

// Génération d'une surface de volatilité fictive
const generateVolSurface = () => {
  const strikes = [0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.2];
  const maturities = [0.1, 0.25, 0.5, 1, 2];
  
  const volSurface = [];
  
  for (const mat of maturities) {
    for (const strike of strikes) {
      // Génération d'un smile en fonction du strike (forme de U)
      const skewComponent = 0.1 * Math.pow(strike - 1, 2);
      // Ajout d'un terme décroissant avec la maturité
      const termComponent = 0.05 * Math.sqrt(mat);
      // Volatilité de base
      const baseVol = 0.2;
      
      const vol = baseVol + skewComponent + termComponent;
      
      volSurface.push({
        strike,
        maturity: mat,
        impliedVol: vol
      });
    }
  }
  
  return volSurface;
};

// Simulation de calibration (Black, SABR, Heston)
const calibrateModel = (model: string, volSurface: any[]) => {
  // Simulation de délai
  return new Promise<any>((resolve) => {
    setTimeout(() => {
      let parameters: any = {};
      let calibratedSurface: any[] = [];
      let error = 0;
      
      switch (model) {
        case 'black':
          // Modèle le plus simple, juste une volatilité constante
          const avgVol = volSurface.reduce((sum, point) => sum + point.impliedVol, 0) / volSurface.length;
          parameters = { sigma: avgVol.toFixed(4) };
          
          // Calculer l'erreur et la surface calibrée
          calibratedSurface = volSurface.map(point => ({
            ...point,
            modelVol: avgVol,
            error: Math.abs(point.impliedVol - avgVol)
          }));
          
          error = calibratedSurface.reduce((sum, point) => sum + Math.pow(point.error, 2), 0) / calibratedSurface.length;
          break;
          
        case 'sabr':
          // Paramètres fictifs pour SABR
          parameters = {
            alpha: (0.15 + Math.random() * 0.05).toFixed(4),
            beta: (0.7 + Math.random() * 0.2).toFixed(4),
            rho: (-0.3 + Math.random() * 0.2).toFixed(4),
            nu: (0.3 + Math.random() * 0.1).toFixed(4)
          };
          
          // Surface calibrée fictive (plus précise que Black)
          calibratedSurface = volSurface.map(point => {
            const baseVol = parseFloat(parameters.alpha);
            const skew = parseFloat(parameters.beta) * (point.strike - 1);
            const maturityEffect = parseFloat(parameters.nu) * Math.sqrt(point.maturity);
            const modelVol = baseVol + skew * parseFloat(parameters.rho) + maturityEffect;
            const diff = point.impliedVol - modelVol;
            
            return {
              ...point,
              modelVol,
              error: Math.abs(diff)
            };
          });
          
          error = calibratedSurface.reduce((sum, point) => sum + Math.pow(point.error, 2), 0) / calibratedSurface.length;
          break;
          
        case 'heston':
          // Paramètres fictifs pour Heston
          parameters = {
            v0: (0.02 + Math.random() * 0.03).toFixed(4),
            kappa: (1.5 + Math.random() * 1.0).toFixed(4),
            theta: (0.04 + Math.random() * 0.02).toFixed(4),
            sigma: (0.3 + Math.random() * 0.2).toFixed(4),
            rho: (-0.7 + Math.random() * 0.2).toFixed(4)
          };
          
          // Surface calibrée fictive (plus précise que SABR)
          calibratedSurface = volSurface.map(point => {
            const baseVol = parseFloat(parameters.theta);
            const skew = 0.3 * Math.pow(point.strike - 1, 2);
            const maturityEffect = parseFloat(parameters.sigma) * Math.sqrt(point.maturity);
            const modelVol = baseVol + skew * parseFloat(parameters.rho) + maturityEffect;
            // Ajouter une petite perturbation aléatoire
            const noise = (Math.random() - 0.5) * 0.005;
            const diff = point.impliedVol - (modelVol + noise);
            
            return {
              ...point,
              modelVol: modelVol + noise,
              error: Math.abs(diff)
            };
          });
          
          error = calibratedSurface.reduce((sum, point) => sum + Math.pow(point.error, 2), 0) / calibratedSurface.length;
          // Heston devrait avoir l'erreur la plus faible
          error = error * 0.7;
          break;
      }
      
      resolve({
        parameters,
        calibratedSurface,
        rmse: Math.sqrt(error).toFixed(6)
      });
    }, 1500);
  });
};

const ModelCalibration: React.FC = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);
  
  // États
  const [selectedModel, setSelectedModel] = useState<string>('black');
  const [volSurface, setVolSurface] = useState<any[]>([]);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibrationResults, setCalibrationResults] = useState<any>(null);
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [selectedStrike, setSelectedStrike] = useState<number | null>(null);
  const [selectedMaturity, setSelectedMaturity] = useState<number | null>(null);
  
  // Générer la surface de volatilité
  const generateSurface = () => {
    const surface = generateVolSurface();
    setVolSurface(surface);
    setCalibrationResults(null);
    
    // Sélectionner le premier strike et la première maturité par défaut
    if (surface.length > 0) {
      const uniqueStrikes = [...new Set(surface.map(point => point.strike))];
      const uniqueMaturities = [...new Set(surface.map(point => point.maturity))];
      setSelectedStrike(uniqueStrikes[0]);
      setSelectedMaturity(uniqueMaturities[0]);
    }
  };
  
  // Charger un fichier (simulé)
  const handleFileUpload = () => {
    setFileUploaded(true);
    generateSurface();
  };
  
  // Lancer la calibration
  const startCalibration = async () => {
    if (volSurface.length === 0) {
      generateSurface();
    }
    
    setIsCalibrating(true);
    try {
      const results = await calibrateModel(selectedModel, volSurface);
      setCalibrationResults(results);
    } finally {
      setIsCalibrating(false);
    }
  };
  
  // Obtenir les strikes et maturités uniques
  const getUniqueValues = (key: 'strike' | 'maturity') => {
    if (volSurface.length === 0) return [];
    return [...new Set(volSurface.map(point => point[key]))].sort((a, b) => a - b);
  };
  
  // Préparer les données pour le graphique des smiles
  const prepareSmileData = () => {
    if (!calibrationResults || !selectedMaturity) return [];
    
    const filteredData = calibrationResults.calibratedSurface.filter(
      (point: any) => point.maturity === selectedMaturity
    );
    
    return filteredData.map((point: any) => ({
      x: point.strike,
      y: point.impliedVol * 100 // Convertir en pourcentage
    }));
  };
  
  // Préparer les données pour le graphique des modèles calibrés
  const prepareModelData = () => {
    if (!calibrationResults || !selectedMaturity) return [];
    
    const filteredData = calibrationResults.calibratedSurface.filter(
      (point: any) => point.maturity === selectedMaturity
    );
    
    return filteredData.map((point: any) => ({
      x: point.strike,
      y: point.modelVol * 100 // Convertir en pourcentage
    }));
  };
  
  // Préparer les données pour le graphique des erreurs
  const prepareErrorData = () => {
    if (!calibrationResults || !selectedMaturity) return [];
    
    const filteredData = calibrationResults.calibratedSurface.filter(
      (point: any) => point.maturity === selectedMaturity
    );
    
    return filteredData.map((point: any) => ({
      x: point.strike,
      y: point.error * 100 // Convertir en pourcentage
    }));
  };
  
  // Préparer les données pour le graphique des surfaces
  const prepareSurfaceData = () => {
    if (!volSurface) return [];
    
    // Pour la simplicité, nous allons juste utiliser un échantillon des données
    const sampleData = volSurface.filter((point, index) => index % 3 === 0);
    
    return sampleData.map(point => ({
      x: point.strike,
      y: point.maturity,
      z: point.impliedVol * 100 // Convertir en pourcentage
    }));
  };
  
  // Get the auth context
  const { isAuthenticated, user, profile } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 bg-finance-charcoal">
          <h3 className="text-lg font-medium mb-4 text-finance-accent">Paramètres de calibration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Source des données</label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={generateSurface}
                  className="text-xs flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  <span>Générer une surface</span>
                </Button>
                <div className="text-xs text-finance-lightgray">ou</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleFileUpload}
                  className="text-xs flex items-center gap-1"
                >
                  <Upload size={12} />
                  <span>Upload fichier</span>
                </Button>
                {fileUploaded && (
                  <CheckCircle size={16} className="text-green-500" />
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Modèle à calibrer</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un modèle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="black">Black</SelectItem>
                  <SelectItem value="sabr">SABR</SelectItem>
                  <SelectItem value="heston">Heston</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Options avancées</label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="opt1" />
                  <Label htmlFor="opt1">Contraindre les paramètres</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="opt2" />
                  <Label htmlFor="opt2">Calibration par minimisation RMSE</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="opt3" />
                  <Label htmlFor="opt3">Utiliser les prix d'option</Label>
                </div>
              </div>
            </div>
            
            <Button 
              variant="finance" 
              className="w-full mt-2"
              onClick={startCalibration}
              disabled={isCalibrating}
            >
              {isCalibrating ? (
                <div className="flex items-center">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Calibration en cours...
                </div>
              ) : (
                <div className="flex items-center">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Calibrer le modèle
                </div>
              )}
            </Button>
          </div>
        </Card>
        
        {volSurface.length > 0 && (
          <Card className="p-4 bg-finance-charcoal col-span-1 md:col-span-2">
            <h3 className="text-lg font-medium mb-4 text-finance-accent">Surface de volatilité implicite</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Maturité</label>
                <Select 
                  value={selectedMaturity?.toString() || ''} 
                  onValueChange={(val) => setSelectedMaturity(parseFloat(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une maturité" />
                  </SelectTrigger>
                  <SelectContent>
                    {getUniqueValues('maturity').map((mat) => (
                      <SelectItem key={mat} value={mat.toString()}>
                        {mat} {mat === 1 ? 'an' : 'ans'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Strike</label>
                <Select 
                  value={selectedStrike?.toString() || ''} 
                  onValueChange={(val) => setSelectedStrike(parseFloat(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un strike" />
                  </SelectTrigger>
                  <SelectContent>
                    {getUniqueValues('strike').map((strike) => (
                      <SelectItem key={strike} value={strike.toString()}>
                        {strike * 100}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {selectedMaturity && (
              <div className="h-60">
                <LineChart 
                  data={prepareSmileData()}
                  color="#8884d8"
                  xLabel="Strike (%)"
                  yLabel="Volatilité implicite (%)"
                />
              </div>
            )}
          </Card>
        )}
        
        {calibrationResults && (
          <>
            <Card className="p-4 bg-finance-charcoal col-span-1 md:col-span-3">
              <Tabs defaultValue="parameters">
                <TabsList className="mb-4">
                  <TabsTrigger value="parameters">Paramètres calibrés</TabsTrigger>
                  <TabsTrigger value="fit">Qualité de l'ajustement</TabsTrigger>
                  <TabsTrigger value="surface">Surface 3D</TabsTrigger>
                </TabsList>
                
                <TabsContent value="parameters">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-md font-medium mb-2 text-finance-accent">Paramètres du modèle {selectedModel.toUpperCase()}</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Paramètre</TableHead>
                            <TableHead>Valeur</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(calibrationResults.parameters).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell>{key}</TableCell>
                              <TableCell>{value as string}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell className="font-medium">RMSE</TableCell>
                            <TableCell className="font-medium">{calibrationResults.rmse}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium mb-2 text-finance-accent">Qualité globale</h4>
                      <div className="p-4 bg-finance-steel/10 rounded flex flex-col items-center">
                        <div className="text-xl font-bold mb-1">
                          Erreur quadratique: {calibrationResults.rmse}
                        </div>
                        <div className="text-sm text-finance-lightgray mb-4">
                          Modèle: {selectedModel.toUpperCase()}
                        </div>
                        <div className="w-full h-40">
                          <BarChart 
                            data={[
                              { x: 'RMSE', y: parseFloat(calibrationResults.rmse) * 100 }
                            ]}
                            color="#ea384c"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="fit">
                  {selectedMaturity && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="p-4 bg-finance-steel/5">
                        <h4 className="text-md font-medium mb-2 text-finance-accent">Comparaison modèle vs marché</h4>
                        <div className="h-60">
                          <LineChart 
                            data={[...prepareSmileData(), ...prepareModelData()]}
                            color="#8884d8"
                            xLabel="Strike (%)"
                            yLabel="Volatilité (%)"
                          />
                        </div>
                      </Card>
                      
                      <Card className="p-4 bg-finance-steel/5">
                        <h4 className="text-md font-medium mb-2 text-finance-accent">Erreur par strike</h4>
                        <div className="h-60">
                          <BarChart 
                            data={prepareErrorData()}
                            color="#ea384c"
                            xLabel="Strike (%)"
                            yLabel="Erreur (%)"
                          />
                        </div>
                      </Card>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="surface">
                  <div className="p-4 bg-finance-steel/5 h-80 flex items-center justify-center">
                    <div className="text-center">
                      <h4 className="text-md font-medium mb-2 text-finance-accent">Visualisation 3D de la surface</h4>
                      <p className="text-finance-lightgray text-sm mb-4">
                        Fonctionnalité à venir: visualisation 3D avec WebGL
                      </p>
                      <div className="border border-dashed border-finance-steel/30 rounded-lg p-8 text-finance-steel">
                        Visualiseur 3D en développement
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </>
        )}
      </div>
      
      {/* Add a separator between the official models and the user models */}
      <Separator className="my-8" />
      
      {/* Add the user models section */}
      <UserModelsSection 
        isAuthenticated={isAuthenticated} 
        userName={profile?.prenom || user?.email?.split('@')[0] || 'Utilisateur'} 
        userId={user?.id || 'unknown-user'}
      />
    </div>
  );
};

export default ModelCalibration;
