
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

// Type definitions
interface Tag {
  id: string;
  text: string;
}

const Contribute = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("article");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [strategyType, setStrategyType] = useState("pricing");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // For a real implementation, we'd use the user's session
  const author = profile?.prenom && profile?.nom 
    ? `${profile.prenom} ${profile.nom}` 
    : "Utilisateur anonyme";

  const addTag = () => {
    if (tagInput.trim() !== "" && tags.length < 5) {
      const newTag = {
        id: Date.now().toString(),
        text: tagInput.trim()
      };
      setTags([...tags, newTag]);
      setTagInput("");
    }
  };

  const removeTag = (id: string) => {
    setTags(tags.filter(tag => tag.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput) {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real app, we'd save to the database here
      // For demonstration, we'll just simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Publication created:", {
        type: activeTab,
        title,
        author,
        content,
        summary,
        tags: tags.map(t => t.text),
        strategyType: activeTab === "strategy" ? strategyType : null,
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

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Contribuer à la communauté</h1>
          <p className="text-finance-lightgray">
            Partagez vos connaissances et stratégies en finance quantitative
          </p>
        </div>

        <Tabs defaultValue="article" value={activeTab} onValueChange={setActiveTab}>
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
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input 
                    id="title" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={activeTab === "article" ? "Titre de votre article" : "Nom de votre stratégie"}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="summary">Résumé</Label>
                  <Textarea 
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Résumé en quelques phrases (300 caractères max)"
                    maxLength={300}
                    required
                  />
                  <div className="text-right text-xs text-finance-lightgray">
                    {summary.length}/300
                  </div>
                </div>
                
                {activeTab === "strategy" && (
                  <div className="space-y-2">
                    <Label>Type de stratégie</Label>
                    <RadioGroup 
                      value={strategyType}
                      onValueChange={setStrategyType}
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
                  <Textarea 
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={activeTab === "article" 
                      ? "Contenu détaillé de votre article..." 
                      : "Description détaillée de votre stratégie, incluant formules et méthodologie..."}
                    className="min-h-[200px]"
                    required
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
                      disabled={tags.length >= 5}
                    />
                    <Button 
                      type="button" 
                      onClick={addTag}
                      disabled={tags.length >= 5 || tagInput.trim() === ""}
                      size="icon"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map(tag => (
                        <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                          {tag.text}
                          <button 
                            type="button" 
                            onClick={() => removeTag(tag.id)}
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
