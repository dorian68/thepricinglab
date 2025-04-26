
import React from 'react';

interface PayoffChartProps {
  strategy: any;
  results: any;
}

const PayoffChart: React.FC<PayoffChartProps> = ({ strategy, results }) => {
  // Safely handle the case where strategy or results is undefined
  if (!strategy || !results) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-center text-finance-lightgray">
          Données de payoff non disponibles
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-center text-finance-lightgray">
        Diagramme de Payoff à implémenter avec une bibliothèque de graphiques
        <br />
        (Cette composante est un placeholder pour l'instant)
      </p>
    </div>
  );
};

export default PayoffChart;
