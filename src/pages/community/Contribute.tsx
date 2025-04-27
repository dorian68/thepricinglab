
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { BookOpen, Code, Save, X, Plus, Calculator, ChartLine, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "../../contexts/AuthContext";
import MarkdownMathEditor from "../../components/editors/MarkdownMathEditor";
import { PublicationFormData, PublicationType, StrategyType } from "../../types/community";
import PayoffChart from "@/components/strategies/PayoffChart";
import GreekDisplay from "@/components/strategies/GreekDisplay";
import { Strategy as TradingStrategy, OptionLeg } from "@/types/strategies";
import { calculateStrategyResults } from "@/utils/options/strategyCalculator";
import { defaultStrategies } from "@/utils/options/strategyDefaults";

// Type definitions
interface Tag {
  id: string;
  text: string;
}

interface UnderlyingAsset {
  id: string;
  type: 'stock' | 'bond' | 'index' | 'future' | 'option';
  name: string;
  price: number;
  volatility: number;
  maturity?: Date;
}

interface StructuredProduct {
  name: string;
  description: string;
  underlyings: UnderlyingAsset[];
  legs: OptionLeg[];
  spotPrice: number;
  volatility: number;
  timeToMaturity: number;
  interestRate: number;
  dividendYield: number;
  isPublic: boolean;
}

const Contribute = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<PublicationType>("article");
  const [formData, setFormData] = useState<PublicationFormData>({
    title: "",
    summary: "",
    content: "",
    tags: [],
    type: "article",
    strategyType: "pricing"
  });
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // For structured product creation
  const [structuredProduct, setStructuredProduct] = useState<StructuredProduct>({
    name: "Nouveau Produit Structuré",
    description: "Description du produit",
    underlyings: [],
    legs: [
      { strike: 100, type: "call", position: "long", quantity: 1 }
    ],
    spotPrice: 100,
    volatility: 0.2,
    timeToMaturity: 1.0,
    interestRate: 0.05,
    dividendYield: 0,
    isPublic: true
  });
  
  // For pricing calculation
  const [pricingMethod, setPricingMethod] = useState<'analytical' | 'monteCarlo'>('analytical');
  const [calculationResults, setCalculationResults] = useState<any>(null);
  const [showAdvancedParameters, setShowAdvancedParameters] = useState(false);
  
  // Mock data for underlying assets
  const availableUnderlyings: UnderlyingAsset[] = [
    { id: "aapl", type: 'stock', name: 'Apple Inc.', price: 180.5, volatility: 0.25 },
    { id: "msft", type: 'stock', name: 'Microsoft', price: 320.2, volatility: 0.22 },
    { id: "amzn", type: 'stock', name: 'Amazon', price: 150.8, volatility: 0.28 },
    { id: "googl", type: 'stock', name: 'Alphabet', price: 140.3, volatility: 0.24 },
    { id: "spy", type: 'index', name: 'S&P 500 ETF', price: 450.7, volatility: 0.18 },
    { id: "qqq", type: 'index', name: 'NASDAQ ETF', price: 380.4, volatility: 0.21 },
    { id: "t-10y", type: 'bond', name: 'Treasury 10Y', price: 98.7, volatility: 0.08 },
    { id: "cl-fut", type: 'future', name: 'Crude Oil Future', price: 75.2, volatility: 0.32 },
  ];
  
  // For a real implementation, we'd use the user's session
  const author = profile?.prenom && profile?.nom 
    ? `${profile.prenom} ${profile.nom}` 
    : "Utilisateur anonyme";

  // Effect to calculate results when structured product changes
  useEffect(() => {
    if (activeTab === "strategy") {
      calculateProductResults();
    }
  }, [structuredProduct, pricingMethod]);
  
  const addTag = () => {
    if (tagInput.trim() !== "" && formData.tags.length < 5) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput) {
      e.preventDefault();
      addTag();
    }
  };
  
  const handleChange = (field: keyof PublicationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleTabChange = (tab: PublicationType) => {
    setActiveTab(tab);
    setFormData(prev => ({ ...prev, type: tab }));
  };

  // Add an underlying asset
  const addUnderlying = (assetId: string) => {
    const selectedAsset = availableUnderlyings.find(asset => asset.id === assetId);
    if (selectedAsset && !structuredProduct.underlyings.find(u => u.id === assetId)) {
      setStructuredProduct(prev => ({
        ...prev,
        underlyings: [...prev.underlyings, selectedAsset],
        spotPrice: selectedAsset.price,
        volatility: selectedAsset.volatility
      }));
    }
  };
  
  // Remove an underlying asset
  const removeUnderlying = (assetId: string) => {
    setStructuredProduct(prev => ({
      ...prev,
      underlyings: prev.underlyings.filter(u => u.id !== assetId)
    }));
  };
  
  // Add an option leg
  const addLeg = (type: 'call' | 'put', position: 'long' | 'short') => {
    const newLeg: OptionLeg = {
      strike: structuredProduct.spotPrice,
      type,
      position,
      quantity: 1
    };
    
    setStructuredProduct(prev => ({
      ...prev,
      legs: [...prev.legs, newLeg]
    }));
  };
  
  // Remove an option leg
  const removeLeg = (index: number) => {
    setStructuredProduct(prev => ({
      ...prev,
      legs: prev.legs.filter((_, i) => i !== index)
    }));
  };
  
  // Update leg parameters
  const updateLeg = (index: number, field: keyof OptionLeg, value: any) => {
    setStructuredProduct(prev => {
      const updatedLegs = [...prev.legs];
      updatedLegs[index] = {
        ...updatedLegs[index],
        [field]: value
      };
      return {
        ...prev,
        legs: updatedLegs
      };
    });
  };
  
  // Calculate results for the structured product
  const calculateProductResults = () => {
    // Build a TradingStrategy object from our structured product
    const tradingStrategy: TradingStrategy = {
      id: "temp-strategy",
      name: structuredProduct.name,
      category: "structured",
      description: structuredProduct.description,
      parameters: {
        spotPrice: structuredProduct.spotPrice,
        volatility: structuredProduct.volatility,
        timeToMaturity: structuredProduct.timeToMaturity,
        interestRate: structuredProduct.interestRate,
        dividendYield: structuredProduct.dividendYield,
        legs: structuredProduct.legs
      }
    };
    
    // Calculate results using the Black-Scholes calculator
    const results = calculateStrategyResults(tradingStrategy);
    setCalculationResults(results);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (activeTab === "article") {
        // In a real app, we'd save the article to the database here
        console.log("Article created:", {
          ...formData,
          author,
          date: new Date().toISOString().split('T')[0],
          published: true
        });
      } else {
        // For strategy, we'd save the structured product
        console.log("Strategy created:", {
          title: structuredProduct.name,
          summary: structuredProduct.description,
          author,
          type: "strategy",
          strategyType: formData.strategyType,
          date: new Date().toISOString().split('T')[0],
          published: structuredProduct.isPublic,
          strategyData: {
            spotPrice: structuredProduct.spotPrice,
            volatility: structuredProduct.volatility,
            timeToMaturity: structuredProduct.timeToMaturity,
            interestRate: structuredProduct.interestRate,
            dividendYield: structuredProduct.dividendYield,
            legs: structuredProduct.legs
          }
        });
      }
      
      // Navigate to the explore page
      navigate("/community/explore");
    } catch (error) {
      console.error("Error creating publication:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Contribuer | The Pricing Library</title>
        <meta name="description" content="Partagez vos connaissances et stratégies en finance quantitative avec notre communauté" />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Contribuer à la communauté</h1>
          <p className="text-finance-lightgray">
            Partagez vos connaissances et stratégies en finance quantitative
          </p>
        </div>

        <Tabs defaultValue="article" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="article" className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4" />
              Article
            </TabsTrigger>
            <TabsTrigger value="strategy" className="flex items-center">
              <Code className="mr-2 h-4 w-4" />
              Stratégie
            </TabsTrigger>
          </TabsList>

          <TabsContent value="article">
            <Card>
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Écrire un article</CardTitle>
                  <CardDescription>
                    Partagez vos connaissances et réflexions en finance quantitative
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="article-title">Titre</Label>
                    <Input 
                      id="article-title" 
                      value={formData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      placeholder="Titre de votre article"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="article-summary">Résumé</Label>
                    <Textarea 
                      id="article-summary"
                      value={formData.summary}
                      onChange={(e) => handleChange("summary", e.target.value)}
                      placeholder="Résumé en quelques phrases (300 caractères max)"
                      maxLength={300}
                      required
                      className="resize-none"
                    />
                    <div className="text-right text-xs text-finance-lightgray">
                      {formData.summary.length}/300
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="article-content">Contenu</Label>
                    <MarkdownMathEditor
                      value={formData.content}
                      onChange={(value) => handleChange("content", value)}
                      placeholder="Contenu détaillé de votre article..."
                      height="min-h-[400px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="article-tags">Tags (facultatif, max 5)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="article-tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ajouter un tag et appuyer sur Enter"
                        disabled={formData.tags.length >= 5}
                      />
                      <Button 
                        type="button" 
                        onClick={addTag}
                        disabled={formData.tags.length >= 5 || tagInput.trim() === ""}
                        size="icon"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button 
                              type="button" 
                              onClick={() => removeTag(tag)}
                              className="text-finance-lightgray hover:text-finance-accent"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-finance-lightgray">
                      Publié en tant que : <span className="text-finance-accent">{author}</span>
                    </p>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                    Annuler
                  </Button>
                  <Button variant="finance" type="submit" disabled={isSubmitting} className="flex items-center">
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Publication en cours..." : "Publier"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="strategy">
            <Card>
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Créer une stratégie</CardTitle>
                  <CardDescription>
                    Composez un produit structuré et analysez sa performance
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Section 1: Basic Strategy Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-finance-accent">Informations générales</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="strategy-name">Nom de la stratégie</Label>
                      <Input 
                        id="strategy-name" 
                        value={structuredProduct.name}
                        onChange={(e) => setStructuredProduct(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nom de votre stratégie"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="strategy-description">Description</Label>
                      <Textarea 
                        id="strategy-description"
                        value={structuredProduct.description}
                        onChange={(e) => setStructuredProduct(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Décrivez brièvement cette stratégie (300 caractères max)"
                        maxLength={300}
                        required
                        className="resize-none"
                      />
                      <div className="text-right text-xs text-finance-lightgray">
                        {structuredProduct.description.length}/300
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="strategy-type">Type de stratégie</Label>
                      <RadioGroup 
                        value={formData.strategyType}
                        onValueChange={(value: StrategyType) => handleChange("strategyType", value)}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pricing" id="pricing" />
                          <Label htmlFor="pricing">Pricing d'options</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="hedging" id="hedging" />
                          <Label htmlFor="hedging">Stratégie de couverture</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="trading" id="trading" />
                          <Label htmlFor="trading">Stratégie de trading</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="other" />
                          <Label htmlFor="other">Autre</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Section 2: Underlying Assets */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-finance-accent">Sous-jacents</h3>
                      <Select onValueChange={addUnderlying}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Ajouter un actif" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUnderlyings.map(asset => (
                            <SelectItem 
                              key={asset.id}
                              value={asset.id}
                              disabled={structuredProduct.underlyings.some(u => u.id === asset.id)}
                            >
                              {asset.name} - {asset.price}€
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {structuredProduct.underlyings.length === 0 ? (
                      <div className="bg-finance-charcoal p-4 rounded-md text-center text-finance-lightgray">
                        Aucun sous-jacent sélectionné. Ajoutez au moins un actif pour commencer.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {structuredProduct.underlyings.map(asset => (
                          <Card key={asset.id} className="bg-finance-charcoal">
                            <CardContent className="p-4 flex justify-between items-center">
                              <div>
                                <p className="font-medium">{asset.name}</p>
                                <div className="text-sm text-finance-lightgray mt-1 flex flex-wrap gap-x-4">
                                  <span>Prix: {asset.price}€</span>
                                  <span>Vol: {(asset.volatility * 100).toFixed(1)}%</span>
                                  <span>Type: {asset.type}</span>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeUnderlying(asset.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                    
                    {/* Market Parameters Configurator */}
                    {structuredProduct.underlyings.length > 0 && (
                      <div className="space-y-4 mt-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Paramètres de marché</h4>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowAdvancedParameters(!showAdvancedParameters)}
                            className="flex items-center gap-1"
                          >
                            <Settings className="h-3 w-3" />
                            {showAdvancedParameters ? "Masquer" : "Avancés"}
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="spot-price">Prix du sous-jacent</Label>
                            <div className="flex items-center space-x-2">
                              <Input 
                                id="spot-price" 
                                type="number" 
                                value={structuredProduct.spotPrice}
                                onChange={(e) => setStructuredProduct(prev => ({ ...prev, spotPrice: Number(e.target.value) }))}
                                min={1}
                                step={0.1}
                              />
                              <span>€</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="volatility" className="flex justify-between">
                              <span>Volatilité</span>
                              <span className="text-finance-lightgray">{(structuredProduct.volatility * 100).toFixed(1)}%</span>
                            </Label>
                            <Slider
                              id="volatility"
                              min={0.01}
                              max={1}
                              step={0.01}
                              value={[structuredProduct.volatility]}
                              onValueChange={([vol]) => setStructuredProduct(prev => ({ ...prev, volatility: vol }))}
                            />
                          </div>
                        </div>
                        
                        {showAdvancedParameters && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-finance-dark rounded-md mt-2">
                            <div className="space-y-2">
                              <Label htmlFor="time-to-maturity" className="flex justify-between">
                                <span>Échéance (années)</span>
                                <span className="text-finance-lightgray">{structuredProduct.timeToMaturity}</span>
                              </Label>
                              <Slider
                                id="time-to-maturity"
                                min={0.1}
                                max={5}
                                step={0.1}
                                value={[structuredProduct.timeToMaturity]}
                                onValueChange={([ttm]) => setStructuredProduct(prev => ({ ...prev, timeToMaturity: ttm }))}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="interest-rate" className="flex justify-between">
                                <span>Taux d'intérêt</span>
                                <span className="text-finance-lightgray">{(structuredProduct.interestRate * 100).toFixed(2)}%</span>
                              </Label>
                              <Slider
                                id="interest-rate"
                                min={0}
                                max={0.2}
                                step={0.001}
                                value={[structuredProduct.interestRate]}
                                onValueChange={([rate]) => setStructuredProduct(prev => ({ ...prev, interestRate: rate }))}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="dividend-yield" className="flex justify-between">
                                <span>Dividende</span>
                                <span className="text-finance-lightgray">{(structuredProduct.dividendYield * 100).toFixed(2)}%</span>
                              </Label>
                              <Slider
                                id="dividend-yield"
                                min={0}
                                max={0.1}
                                step={0.001}
                                value={[structuredProduct.dividendYield]}
                                onValueChange={([div]) => setStructuredProduct(prev => ({ ...prev, dividendYield: div }))}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Section 3: Strategy Components Construction */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-finance-accent">Composants de la stratégie</h3>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => addLeg('call', 'long')}
                          className="text-xs"
                        >
                          + Call long
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => addLeg('call', 'short')}
                          className="text-xs"
                        >
                          + Call short
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => addLeg('put', 'long')}
                          className="text-xs"
                        >
                          + Put long
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => addLeg('put', 'short')}
                          className="text-xs"
                        >
                          + Put short
                        </Button>
                      </div>
                    </div>
                    
                    {structuredProduct.legs.length === 0 ? (
                      <div className="bg-finance-charcoal p-4 rounded-md text-center text-finance-lightgray">
                        Aucun composant ajouté. Créez une stratégie en ajoutant des options.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {structuredProduct.legs.map((leg, index) => (
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
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
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
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Section 4: Pricing and Analysis */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-finance-accent">Analyse et Pricing</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="pricing-method">Méthode</Label>
                          <Select 
                            value={pricingMethod}
                            onValueChange={(value: 'analytical' | 'monteCarlo') => setPricingMethod(value)}
                          >
                            <SelectTrigger id="pricing-method" className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="analytical">Analytique</SelectItem>
                              <SelectItem value="monteCarlo">Monte Carlo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Button 
                          variant="finance"
                          onClick={calculateProductResults}
                          className="flex items-center gap-2"
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
                            strategy={{
                              id: "temp-id",
                              name: structuredProduct.name,
                              category: "structured",
                              description: structuredProduct.description,
                              parameters: {
                                spotPrice: structuredProduct.spotPrice,
                                volatility: structuredProduct.volatility,
                                timeToMaturity: structuredProduct.timeToMaturity,
                                interestRate: structuredProduct.interestRate,
                                dividendYield: structuredProduct.dividendYield,
                                legs: structuredProduct.legs
                              }
                            }} 
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
                            strategy={{
                              id: "temp-id",
                              name: structuredProduct.name,
                              category: "structured",
                              description: structuredProduct.description,
                              parameters: {
                                spotPrice: structuredProduct.spotPrice,
                                volatility: structuredProduct.volatility,
                                timeToMaturity: structuredProduct.timeToMaturity,
                                interestRate: structuredProduct.interestRate,
                                dividendYield: structuredProduct.dividendYield,
                                legs: structuredProduct.legs
                              }
                            }} 
                            results={calculationResults}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Section 5: Publication Options */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-finance-accent">Options de publication</h3>
                    
                    <div className="flex items-center justify-between p-4 bg-finance-charcoal rounded-lg">
                      <div>
                        <p className="font-medium">Visibilité</p>
                        <p className="text-sm text-finance-lightgray">Rendre cette stratégie visible pour tous</p>
                      </div>
                      <Switch 
                        checked={structuredProduct.isPublic} 
                        onCheckedChange={(checked) => setStructuredProduct(prev => ({ ...prev, isPublic: checked }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="strategy-tags">Tags (facultatif, max 5)</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="strategy-tags"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Ajouter un tag et appuyer sur Enter"
                          disabled={formData.tags.length >= 5}
                        />
                        <Button 
                          type="button" 
                          onClick={addTag}
                          disabled={formData.tags.length >= 5 || tagInput.trim() === ""}
                          size="icon"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {tag}
                              <button 
                                type="button" 
                                onClick={() => removeTag(tag)}
                                className="text-finance-lightgray hover:text-finance-accent"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-finance-lightgray">
                        Publié en tant que : <span className="text-finance-accent">{author}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                    Annuler
                  </Button>
                  <Button variant="finance" type="submit" disabled={isSubmitting} className="flex items-center">
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Publication en cours..." : "Publier la stratégie"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Contribute;
