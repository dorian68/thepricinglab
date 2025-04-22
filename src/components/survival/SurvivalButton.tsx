
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Loader, Flame } from "lucide-react";
import { toast } from "sonner";

interface SurvivalButtonProps {
  waveId: number;
  className?: string;
}

const SurvivalButton = ({ waveId, className }: SurvivalButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleStartSurvival = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('https://dorian68.app.n8n.cloud/webhook-test/435a0a2a-33bd-4afb-9f7f-8891ba6b6cb2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: "Génère-moi des questions de type 'survie' en finance de marché"
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const questions = await response.json();
      
      // Store questions in sessionStorage to persist across navigation
      sessionStorage.setItem('survival-questions', JSON.stringify(questions));
      
      // Navigate to the wave detail page
      navigate(`/survival-mode/wave/${waveId}`);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      toast.error("Erreur lors de la génération des questions. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="finance"
      className={`relative group ${className}`}
      onClick={handleStartSurvival}
      disabled={isLoading}
    >
      <div className="flex items-center space-x-2">
        {isLoading ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            <span>Préparation du mode survie...</span>
          </>
        ) : (
          <>
            <Flame className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>Lancer le mode survie</span>
          </>
        )}
      </div>
    </Button>
  );
};

export default SurvivalButton;
