
import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { BookOpen, Code, Save, X, Plus, Lightning } from "lucide-react";
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
import { useAuth } from "../../contexts/AuthContext";
import MarkdownMathEditor from "../../components/editors/MarkdownMathEditor";
import { PublicationFormData, PublicationType, StrategyType } from "../../types/community";
import StructuredProductBuilder from "@/components/strategies/StructuredProductBuilder";
import { Strategy } from "@/types/strategies";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from 'uuid';

const Contribute = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
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
  
  // For a real implementation, we'd use the user's session
  const author = profile?.prenom && profile?.nom 
    ? `${profile.prenom} ${profile.nom}` 
    : "Utilisateur anonyme";

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

  const handleStrategySubmit = (strategy: Strategy, isDraft: boolean) => {
    setIsSubmitting(true);
    
    try {
      // In a real app, we'd save the strategy to the database here
      console.log("Strategy submitted:", {
        strategy,
        isDraft,
        author,
        date: new Date().toISOString(),
        tags: formData.tags
      });
      
      toast({
        title: isDraft ? "Brouillon sauvegardé" : "Stratégie publiée",
        description: isDraft 
          ? "Votre produit structuré a été sauvegardé en tant que brouillon."
          : "Votre produit structuré a été publié avec succès.",
      });
      
      // Redirect to the explore page
      navigate("/community/explore");
    } catch (error) {
      console.error("Error saving strategy:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde de votre stratégie.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real app, we'd save the article to the database here
      console.log("Article created:", {
        ...formData,
        author,
        date: new Date().toISOString(),
        published: true
      });
      
      toast({
        title: "Article publié",
        description: "Votre article a été publié avec succès.",
      });
      
      // Redirect to the explore page
      navigate("/community/explore");
    } catch (error) {
      console.error("Error creating article:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la publication de votre article.",
        variant: "destructive",
      });
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

      <div className="max-w-5xl mx-auto">
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
              Produit Structuré
            </TabsTrigger>
          </TabsList>

          <TabsContent value="article">
            <Card>
              <form onSubmit={handleArticleSubmit}>
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
                  <Button 
                    variant="finance" 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="flex items-center"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Publication en cours..." : "Publier"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="strategy">
            <Card>
              <CardHeader>
                <CardTitle>Créer un produit structuré</CardTitle>
                <CardDescription>
                  Composez et analysez un produit structuré personnalisé
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <StructuredProductBuilder
                  onSave={handleStrategySubmit}
                  initialStrategy={{
                    id: uuidv4(),
                    name: "Nouveau Produit Structuré",
                    category: "structured",
                    description: "Description du produit structuré",
                    parameters: {
                      spotPrice: 100,
                      volatility: 0.2,
                      timeToMaturity: 1.0,
                      interestRate: 0.05,
                      dividendYield: 0,
                      nominal: 1000,
                      legs: [
                        {
                          strike: 100,
                          type: "call",
                          position: "long",
                          quantity: 1
                        }
                      ]
                    }
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Contribute;
