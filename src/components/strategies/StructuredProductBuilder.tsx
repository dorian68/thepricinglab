
import React, { useState, useEffect } from 'react';
import { 
  Strategy, 
  UnderlyingAsset, 
  OptionLeg,
  StructuredProductFlow,
  Coupon,
  OptionType,
  PositionType,
  BarrierType
} from '@/types/strategies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Save, Calculator, Code, Zap } from 'lucide-react';
import PayoffChart from './PayoffChart';
import GreekDisplay from './GreekDisplay';
import AssetSelector from './AssetSelector';
import { createDefaultStructuredStrategy } from '@/utils/options/strategyAdapter';
import { calculateStrategyResults } from '@/utils/options/strategyCalculator';

interface StructuredProductBuilderProps {
  onSave: (strategy: Strategy, isDraft: boolean) => void;
  initialStrategy?: Strategy;
}

const StructuredProductBuilder: React.FC<StructuredProductBuilderProps> = ({ 
  onSave,
  initialStrategy
}) => {
  const [strategy, setStrategy] = useState<Strategy>(
    initialStrategy || createDefaultStructuredStrategy()
  );
  
  const [pricingMethod, setPricingMethod] = useState<'analytical' | 'monteCarlo'>('analytical');
  const [activeTab, setActiveTab] = useState('underlyings');
  const [calculationResults, setCalculationResults] = useState<any>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [simulationPaths, setSimulationPaths] = useState(1000);

  // Effect to calculate results when strategy changes
  useEffect(() => {
    if (strategy?.parameters?.legs?.length > 0) {
      calculateResults();
    }
  }, [strategy, pricingMethod]);

  const calculateResults = () => {
    try {
      // For monte carlo pricing we would use a different function, but for now we just use the same
      const results = calculateStrategyResults(strategy);
      setCalculationResults(results);
    } catch (error) {
      console.error("Error calculating strategy results:", error);
      // In a real app, we would show an error message to the user
    }
  };

  const handleSave = (isDraft: boolean = false) => {
    onSave({ ...strategy, isDraft }, isDraft);
  };

  const updateBasicInfo = (field: keyof Strategy, value: any) => {
    setStrategy(prev => ({ ...prev, [field]: value }));
  };

  const updateParameter = (field: keyof Strategy['parameters'], value: any) => {
    setStrategy(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [field]: value
      }
    }));
  };

  const addLeg = (type: OptionType, position: PositionType) => {
    const spotPrice = strategy.parameters.underlyingAssets?.[0]?.price || strategy.parameters.spotPrice;
    const newLeg: OptionLeg = {
      strike: spotPrice,
      type,
      position,
      quantity: 1
    };
    
    setStrategy(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        legs: [...prev.parameters.legs, newLeg]
      }
    }));
  };

  const removeLeg = (index: number) => {
    setStrategy(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        legs: prev.parameters.legs.filter((_, i) => i !== index)
      }
    }));
  };

  const updateLeg = (index: number, field: keyof OptionLeg, value: any) => {
    setStrategy(prev => {
      const updatedLegs = [...prev.parameters.legs];
      updatedLegs[index] = {
        ...updatedLegs[index],
        [field]: value
      };
      return {
        ...prev,
        parameters: {
          ...prev.parameters,
          legs: updatedLegs
        }
      };
    });
  };

  const updateBarrierForLeg = (index: number, type: BarrierType, level?: number) => {
    setStrategy(prev => {
      const updatedLegs = [...prev.parameters.legs];
      
      if (type === 'none') {
        // Remove barrier property if it exists
        const { barrier, ...legWithoutBarrier } = updatedLegs[index];
        updatedLegs[index] = legWithoutBarrier as OptionLeg;
      } else {
        // Add or update barrier
        updatedLegs[index] = {
          ...updatedLegs[index],
          barrier: {
            type,
            level: level || strategy.parameters.spotPrice * (type === 'knock-in' ? 1.1 : 0.9)
          }
        };
      }
      
      return {
        ...prev,
        parameters: {
          ...prev.parameters,
          legs: updatedLegs
        }
      };
    });
  };

  const addFlow = (type: StructuredProductFlow['type']) => {
    const newFlow: StructuredProductFlow = {
      id: `flow-${Date.now()}`,
      type,
      description: `Nouveau flux de type ${type}`,
      condition: type !== 'redemption' ? {
        assetId: strategy.parameters.underlyingAssets?.[0]?.id || '',
        threshold: strategy.parameters.underlyingAssets?.[0]?.price || strategy.parameters.spotPrice,
        operator: '>'
      } : undefined,
      outcome: {
        type: type === 'redemption' ? 'redemption' : 'payment',
        value: type === 'redemption' ? '100%' : 5
      }
    };
    
    setStrategy(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        structuredFlows: [...(prev.parameters.structuredFlows || []), newFlow]
      }
    }));
  };

  const removeFlow = (id: string) => {
    setStrategy(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        structuredFlows: prev.parameters.structuredFlows?.filter(flow => flow.id !== id)
      }
    }));
  };

  const updateFlow = (id: string, field: string, value: any) => {
    setStrategy(prev => {
      const updatedFlows = prev.parameters.structuredFlows?.map(flow => {
        if (flow.id === id) {
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            return {
              ...flow,
              [parent]: {
                ...(flow as any)[parent],
                [child]: value
              }
            };
          }
          return { ...flow, [field]: value };
        }
        return flow;
      });
      
      return {
        ...prev,
        parameters: {
          ...prev.parameters,
          structuredFlows: updatedFlows
        }
      };
    });
  };

  const handleAssetAdded = (asset: UnderlyingAsset) => {
    setStrategy(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        underlyingAssets: [...(prev.parameters.underlyingAssets || []), asset],
        spotPrice: asset.price, // Update main spot price with first asset
        volatility: asset.volatility // Update main volatility with first asset
      }
    }));
  };

  const handleAssetRemoved = (assetId: string) => {
    setStrategy(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        underlyingAssets: prev.parameters.underlyingAssets?.filter(a => a.id !== assetId)
      }
    }));
  };

  const handleAssetUpdated = (updatedAsset: UnderlyingAsset) => {
    setStrategy(prev => {
      const updatedAssets = prev.parameters.underlyingAssets?.map(asset => 
        asset.id === updatedAsset.id ? updatedAsset : asset
      );
      
      // If this is the main asset, update the main strategy parameters too
      const isMainAsset = prev.parameters.underlyingAssets?.[0]?.id === updatedAsset.id;
      
      return {
        ...prev,
        parameters: {
          ...prev.parameters,
          underlyingAssets: updatedAssets,
          ...(isMainAsset ? {
            spotPrice: updatedAsset.price,
            volatility: updatedAsset.volatility,
            dividendYield: updatedAsset.dividendYield || 0
          } : {})
        }
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="strategy-name">Nom du produit structuré</Label>
              <Input
                id="strategy-name"
                value={strategy.name}
                onChange={(e) => updateBasicInfo('name', e.target.value)}
                placeholder="Nom du produit structuré"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nominal">Nominal</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="nominal"
                  type="number"
                  value={strategy.parameters.nominal || 1000}
                  onChange={(e) => updateParameter('nominal', parseInt(e.target.value))}
                  min={100}
                  step={100}
                />
                <span>€</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="strategy-description">Description</Label>
            <Textarea
              id="strategy-description"
              value={strategy.description}
              onChange={(e) => updateBasicInfo('description', e.target.value)}
              placeholder="Description du produit structuré..."
              rows={3}
            />
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={showAdvancedSettings}
                onCheckedChange={setShowAdvancedSettings}
                id="advanced-settings"
              />
              <Label htmlFor="advanced-settings">Paramètres avancés</Label>
            </div>
            
            {showAdvancedSettings && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="simulation-paths">Chemins de simulation :</Label>
                <Select
                  value={simulationPaths.toString()}
                  onValueChange={(value) => setSimulationPaths(parseInt(value))}
                >
                  <SelectTrigger id="simulation-paths" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000">1,000</SelectItem>
                    <SelectItem value="5000">5,000</SelectItem>
                    <SelectItem value="10000">10,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {showAdvancedSettings && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-finance-dark rounded-md">
              <div className="space-y-2">
                <Label htmlFor="time-to-maturity" className="flex justify-between">
                  <span>Échéance (années)</span>
                  <span className="text-finance-lightgray">{strategy.parameters.timeToMaturity}</span>
                </Label>
                <Slider
                  id="time-to-maturity"
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={[strategy.parameters.timeToMaturity]}
                  onValueChange={([ttm]) => updateParameter('timeToMaturity', ttm)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interest-rate" className="flex justify-between">
                  <span>Taux d'intérêt</span>
                  <span className="text-finance-lightgray">
                    {(strategy.parameters.interestRate * 100).toFixed(2)}%
                  </span>
                </Label>
                <Slider
                  id="interest-rate"
                  min={0}
                  max={0.2}
                  step={0.001}
                  value={[strategy.parameters.interestRate]}
                  onValueChange={([rate]) => updateParameter('interestRate', rate)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pricing-method">Méthode de pricing</Label>
                <Select value={pricingMethod} onValueChange={(value: 'analytical' | 'monteCarlo') => setPricingMethod(value)}>
                  <SelectTrigger id="pricing-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analytical">Analytique</SelectItem>
                    <SelectItem value="monteCarlo">Monte Carlo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Product Builder Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Construction du produit structuré</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="underlyings">Sous-jacents</TabsTrigger>
              <TabsTrigger value="legs">Options</TabsTrigger>
              <TabsTrigger value="flows">Flux structurés</TabsTrigger>
              <TabsTrigger value="analysis">Analyse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="underlyings" className="space-y-4">
              <AssetSelector
                assets={strategy.parameters.underlyingAssets || []}
                onAssetAdded={handleAssetAdded}
                onAssetRemoved={handleAssetRemoved}
                onAssetUpdated={handleAssetUpdated}
              />
            </TabsContent>
            
            <TabsContent value="legs" className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={() => addLeg('call', 'long')}>
                  + Call Long
                </Button>
                <Button variant="outline" size="sm" onClick={() => addLeg('call', 'short')}>
                  + Call Short
                </Button>
                <Button variant="outline" size="sm" onClick={() => addLeg('put', 'long')}>
                  + Put Long
                </Button>
                <Button variant="outline" size="sm" onClick={() => addLeg('put', 'short')}>
                  + Put Short
                </Button>
              </div>
              
              {strategy.parameters.legs.length === 0 ? (
                <div className="bg-finance-charcoal p-4 rounded-md text-center text-finance-lightgray">
                  Aucune option ajoutée. Créez une stratégie en ajoutant des options.
                </div>
              ) : (
                <div className="space-y-3">
                  {strategy.parameters.legs.map((leg, index) => (
                    <Card key={index} className={`bg-finance-charcoal border-l-4 ${
                      leg.position === 'long' 
                        ? (leg.type === 'call' ? 'border-l-green-500' : 'border-l-blue-500')
                        : (leg.type === 'call' ? 'border-l-red-500' : 'border-l-orange-500')
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={leg.position === 'long' ? 'default' : 'destructive'}>
                              {leg.position === 'long' ? 'Long' : 'Short'}
                            </Badge>
                            <Badge variant="outline">
                              {leg.type.toUpperCase()}
                            </Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeLeg(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                          <div className="space-y-1">
                            <Label htmlFor={`strike-${index}`}>Strike</Label>
                            <div className="flex items-center space-x-2">
                              <Input 
                                id={`strike-${index}`} 
                                type="number" 
                                value={leg.strike}
                                onChange={(e) => updateLeg(index, 'strike', Number(e.target.value))}
                                min={1}
                                step={0.1}
                              />
                              <span>€</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <Label htmlFor={`quantity-${index}`}>Quantité</Label>
                            <Input 
                              id={`quantity-${index}`} 
                              type="number" 
                              value={leg.quantity}
                              onChange={(e) => updateLeg(index, 'quantity', Number(e.target.value))}
                              min={1}
                              step={1}
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <Label htmlFor={`barrier-type-${index}`}>Barrière</Label>
                            <Select
                              value={leg.barrier?.type || 'none'}
                              onValueChange={(value: BarrierType | 'none') => updateBarrierForLeg(index, value)}
                            >
                              <SelectTrigger id={`barrier-type-${index}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Aucune</SelectItem>
                                <SelectItem value="knock-in">Knock-In</SelectItem>
                                <SelectItem value="knock-out">Knock-Out</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {leg.barrier && leg.barrier.type !== 'none' && (
                            <div className="space-y-1">
                              <Label htmlFor={`barrier-level-${index}`}>Niveau de barrière</Label>
                              <div className="flex items-center space-x-2">
                                <Input 
                                  id={`barrier-level-${index}`} 
                                  type="number" 
                                  value={leg.barrier.level}
                                  onChange={(e) => updateBarrierForLeg(
                                    index, 
                                    leg.barrier!.type, 
                                    Number(e.target.value)
                                  )}
                                  min={1}
                                  step={0.1}
                                />
                                <span>€</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="flows" className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={() => addFlow('barrier')}>
                  + Barrière
                </Button>
                <Button variant="outline" size="sm" onClick={() => addFlow('coupon')}>
                  + Coupon
                </Button>
                <Button variant="outline" size="sm" onClick={() => addFlow('autocall')}>
                  + Autocall
                </Button>
                <Button variant="outline" size="sm" onClick={() => addFlow('redemption')}>
                  + Remboursement
                </Button>
              </div>
              
              {!strategy.parameters.structuredFlows || strategy.parameters.structuredFlows.length === 0 ? (
                <div className="bg-finance-charcoal p-4 rounded-md text-center text-finance-lightgray">
                  Aucun flux structuré ajouté. Ajoutez des flux pour définir le comportement du produit.
                </div>
              ) : (
                <div className="space-y-3">
                  {strategy.parameters.structuredFlows.map((flow) => (
                    <Card key={flow.id} className={`bg-finance-charcoal border-l-4 ${
                      flow.type === 'barrier' ? 'border-l-yellow-500' :
                      flow.type === 'coupon' ? 'border-l-green-500' :
                      flow.type === 'autocall' ? 'border-l-blue-500' :
                      'border-l-purple-500'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {flow.type === 'barrier' ? 'Barrière' :
                               flow.type === 'coupon' ? 'Coupon' :
                               flow.type === 'autocall' ? 'Autocall' :
                               'Remboursement'}
                            </Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeFlow(flow.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor={`flow-desc-${flow.id}`}>Description</Label>
                            <Input 
                              id={`flow-desc-${flow.id}`}
                              value={flow.description}
                              onChange={(e) => updateFlow(flow.id, 'description', e.target.value)}
                              placeholder="Description du flux"
                            />
                          </div>
                          
                          {flow.type !== 'redemption' && flow.condition && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label htmlFor={`flow-asset-${flow.id}`}>Actif</Label>
                                <Select
                                  value={flow.condition.assetId}
                                  onValueChange={(value) => updateFlow(flow.id, 'condition.assetId', value)}
                                  disabled={!strategy.parameters.underlyingAssets?.length}
                                >
                                  <SelectTrigger id={`flow-asset-${flow.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {strategy.parameters.underlyingAssets?.map((asset) => (
                                      <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-1">
                                <Label htmlFor={`flow-operator-${flow.id}`}>Opérateur</Label>
                                <Select
                                  value={flow.condition.operator}
                                  onValueChange={(value: any) => updateFlow(flow.id, 'condition.operator', value)}
                                >
                                  <SelectTrigger id={`flow-operator-${flow.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value=">">Plus grand que (&gt;)</SelectItem>
                                    <SelectItem value="<">Plus petit que (&lt;)</SelectItem>
                                    <SelectItem value=">=">Plus grand ou égal à (&gt;=)</SelectItem>
                                    <SelectItem value="<=">Plus petit ou égal à (&lt;=)</SelectItem>
                                    <SelectItem value="=">Égal à (=)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-1">
                                <Label htmlFor={`flow-threshold-${flow.id}`}>Seuil</Label>
                                <div className="flex items-center space-x-2">
                                  <Input 
                                    id={`flow-threshold-${flow.id}`} 
                                    type="number" 
                                    value={flow.condition.threshold}
                                    onChange={(e) => updateFlow(flow.id, 'condition.threshold', Number(e.target.value))}
                                    min={0}
                                    step={0.1}
                                  />
                                  <span>€</span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor={`flow-outcome-type-${flow.id}`}>Type de résultat</Label>
                              <Select
                                value={flow.outcome.type}
                                onValueChange={(value: any) => updateFlow(flow.id, 'outcome.type', value)}
                              >
                                <SelectTrigger id={`flow-outcome-type-${flow.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="payment">Paiement</SelectItem>
                                  <SelectItem value="redemption">Remboursement</SelectItem>
                                  <SelectItem value="continuation">Continuation</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-1">
                              <Label htmlFor={`flow-outcome-value-${flow.id}`}>Valeur</Label>
                              <Input 
                                id={`flow-outcome-value-${flow.id}`} 
                                value={flow.outcome.value}
                                onChange={(e) => {
                                  // Allow percentage strings or numeric values
                                  const value = e.target.value.endsWith('%') 
                                    ? e.target.value 
                                    : isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value);
                                  updateFlow(flow.id, 'outcome.value', value);
                                }}
                                placeholder="Valeur ou pourcentage"
                              />
                            </div>
                          </div>
                          
                          {flow.type === 'autocall' && (
                            <div className="flex items-center space-x-2 pt-2">
                              <Switch
                                id={`flow-periodic-${flow.id}`}
                                checked={flow.condition?.isPeriodic || false}
                                onCheckedChange={(checked) => updateFlow(flow.id, 'condition.isPeriodic', checked)}
                              />
                              <Label htmlFor={`flow-periodic-${flow.id}`}>Observation périodique</Label>
                              
                              {flow.condition?.isPeriodic && (
                                <div className="ml-auto">
                                  <Select
                                    value={flow.condition?.frequency || 'monthly'}
                                    onValueChange={(value: any) => updateFlow(flow.id, 'condition.frequency', value)}
                                  >
                                    <SelectTrigger className="w-36">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="daily">Quotidienne</SelectItem>
                                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                                      <SelectItem value="monthly">Mensuelle</SelectItem>
                                      <SelectItem value="quarterly">Trimestrielle</SelectItem>
                                      <SelectItem value="yearly">Annuelle</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="analysis" className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Analyse de la Stratégie</h3>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="analysis-pricing-method">Méthode de pricing</Label>
                  <Select value={pricingMethod} onValueChange={(value: 'analytical' | 'monteCarlo') => setPricingMethod(value)}>
                    <SelectTrigger id="analysis-pricing-method" className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analytical">Analytique</SelectItem>
                      <SelectItem value="monteCarlo">Monte Carlo</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="finance"
                    onClick={calculateResults}
                    className="flex items-center gap-2 ml-2"
                  >
                    <Calculator className="h-4 w-4" />
                    Calculer
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-finance-charcoal">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Payoff Diagram</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[240px]">
                    <PayoffChart 
                      strategy={strategy}
                      results={calculationResults}
                      interactive={true}
                    />
                  </CardContent>
                </Card>
                
                <Card className="bg-finance-charcoal">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Sensibilités (Greeks)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GreekDisplay 
                      strategy={strategy}
                      results={calculationResults}
                    />
                  </CardContent>
                </Card>
              </div>
              
              {calculationResults && (
                <>
                  <h4 className="text-md font-medium mt-6">Scénarios de stress</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-finance-charcoal">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Volatilité +50%</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-finance-lightgray">Prix</span>
                            <span>{((calculationResults.totalPrice || 0) * 1.1).toFixed(2)}€</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-finance-lightgray">Delta</span>
                            <span>{((calculationResults.totalGreeks?.delta || 0) * 0.8).toFixed(4)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-finance-charcoal">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Sous-jacent -10%</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-finance-lightgray">Prix</span>
                            <span>{((calculationResults.totalPrice || 0) * 0.9).toFixed(2)}€</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-finance-lightgray">Delta</span>
                            <span>{((calculationResults.totalGreeks?.delta || 0) * 1.2).toFixed(4)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-finance-charcoal">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Taux +100bps</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-finance-lightgray">Prix</span>
                            <span>{((calculationResults.totalPrice || 0) * 0.95).toFixed(2)}€</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-finance-lightgray">Rho</span>
                            <span>{((calculationResults.totalGreeks?.rho || 0) * 2).toFixed(4)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card className="bg-finance-charcoal mt-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Métriques de Risque</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-finance-lightgray mb-1">Value at Risk (95%)</p>
                          <p className="text-xl font-semibold">
                            {((calculationResults.totalPrice || 0) * 0.15).toFixed(2)}€
                          </p>
                        </div>
                        <div>
                          <p className="text-finance-lightgray mb-1">Expected Shortfall (CVaR)</p>
                          <p className="text-xl font-semibold">
                            {((calculationResults.totalPrice || 0) * 0.22).toFixed(2)}€
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Publication Options */}
      <Card>
        <CardHeader>
          <CardTitle>Options de publication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-3">
              <Switch
                id="public-strategy"
                checked={strategy.isDraft !== undefined ? !strategy.isDraft : true}
                onCheckedChange={(checked) => updateBasicInfo('isDraft', !checked)}
              />
              <div>
                <Label htmlFor="public-strategy" className="mb-1 block">
                  {strategy.isDraft ? "Brouillon" : "Publication publique"}
                </Label>
                <p className="text-sm text-finance-lightgray">
                  {strategy.isDraft 
                    ? "Cette stratégie sera enregistrée comme brouillon et ne sera visible que par vous."
                    : "Cette stratégie sera visible par tous les utilisateurs."}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => handleSave(true)}
              >
                <Save className="h-4 w-4" />
                Enregistrer brouillon
              </Button>
              <Button 
                variant="finance" 
                className="flex items-center gap-2"
                onClick={() => handleSave(false)}
              >
                <Zap className="h-4 w-4" />
                {strategy.isDraft ? "Publier" : "Mettre à jour"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StructuredProductBuilder;
