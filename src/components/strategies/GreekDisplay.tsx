
import React from 'react';

interface GreekDisplayProps {
  strategy: any;
  results: any;
}

const GreekDisplay: React.FC<GreekDisplayProps> = ({ strategy, results }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-center text-finance-lightgray">
        Affichage des Greeks à implémenter avec une bibliothèque de graphiques
        <br />
        (Cette composante est un placeholder pour l'instant)
      </p>
    </div>
  );
};

export default GreekDisplay;
