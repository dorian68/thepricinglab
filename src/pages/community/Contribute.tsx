
import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { BookOpen, Code, Save, X, Plus } from "lucide-react";
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

// Type definitions
interface Tag {
  id: string;
  text: string;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real app, we'd save to the database here
      // For demonstration, we'll just simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Publication created:", {
        ...formData,
        author,
        date: new Date().toISOString().split('T')[0],
        published: true
      });
      
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

          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>
                  {activeTab === "article" ? "Écrire un article" : "Créer une stratégie"}
                </CardTitle>
                <CardDescription>
                  {activeTab === "article" 
                    ? "Partagez vos connaissances et réflexions en finance quantitative" 
                    : "Proposez une stratégie ou un modèle de calcul à la communauté"}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input 
                    id="title" 
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder={activeTab === "article" ? "Titre de votre article" : "Nom de votre stratégie"}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="summary">Résumé</Label>
                  <Textarea 
                    id="summary"
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
                
                {activeTab === "strategy" && (
                  <div className="space-y-2">
                    <Label>Type de stratégie</Label>
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
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="content">{activeTab === "article" ? "Contenu" : "Description et formules"}</Label>
                  <MarkdownMathEditor
                    value={formData.content}
                    onChange={(value) => handleChange("content", value)}
                    placeholder={activeTab === "article" 
                      ? "Contenu détaillé de votre article..." 
                      : "Description détaillée de votre stratégie, incluant formules et méthodologie..."}
                    height="min-h-[400px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (facultatif, max 5)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="tags"
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
        </Tabs>
      </div>
    </div>
  );
};

export default Contribute;
