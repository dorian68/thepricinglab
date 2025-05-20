
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Greeks } from '@/types/strategies';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

interface GreeksTableProps {
  greeks: Greeks;
  isLoading?: boolean;
}

const GreeksTable: React.FC<GreeksTableProps> = ({ greeks, isLoading = false }) => {
  const formatNumber = (num: number): string => {
    if (Math.abs(num) < 0.0001) return '0.0000';
    return num.toFixed(4);
  };

  const getSignClass = (value: number): string => {
    if (value > 0) return "text-green-500";
    if (value < 0) return "text-red-500";
    return "text-finance-lightgray";
  };

  return (
    <Card className="border border-finance-steel/30 bg-finance-charcoal">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Greeks</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-finance-steel/30">
              <TableHead className="w-1/3">Greek</TableHead>
              <TableHead className="w-1/3">Valeur</TableHead>
              <TableHead className="w-1/3">Interprétation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="hover:bg-finance-steel/10 border-finance-steel/20">
              <TableCell className="font-medium">Delta (Δ)</TableCell>
              <TableCell className={getSignClass(greeks.delta)}>
                {isLoading ? '...' : formatNumber(greeks.delta)}
              </TableCell>
              <TableCell className="text-xs text-finance-lightgray">
                {Math.abs(greeks.delta) < 0.1 ? "Faible sensibilité au spot" : 
                 Math.abs(greeks.delta) > 0.9 ? "Très sensible au spot" : 
                 "Sensibilité moyenne au spot"}
              </TableCell>
            </TableRow>
            <TableRow className="hover:bg-finance-steel/10 border-finance-steel/20">
              <TableCell className="font-medium">Gamma (Γ)</TableCell>
              <TableCell className={getSignClass(greeks.gamma)}>
                {isLoading ? '...' : formatNumber(greeks.gamma)}
              </TableCell>
              <TableCell className="text-xs text-finance-lightgray">
                {greeks.gamma > 0.05 ? "Delta très changeant" : "Delta stable"}
              </TableCell>
            </TableRow>
            <TableRow className="hover:bg-finance-steel/10 border-finance-steel/20">
              <TableCell className="font-medium">Vega (ν)</TableCell>
              <TableCell className={getSignClass(greeks.vega)}>
                {isLoading ? '...' : formatNumber(greeks.vega)}
              </TableCell>
              <TableCell className="text-xs text-finance-lightgray">
                {Math.abs(greeks.vega) > 0.5 ? "Très sensible à la volatilité" : "Peu sensible à la volatilité"}
              </TableCell>
            </TableRow>
            <TableRow className="hover:bg-finance-steel/10 border-finance-steel/20">
              <TableCell className="font-medium">Theta (Θ)</TableCell>
              <TableCell className={getSignClass(greeks.theta)}>
                {isLoading ? '...' : formatNumber(greeks.theta)}
              </TableCell>
              <TableCell className="text-xs text-finance-lightgray">
                {greeks.theta < -0.05 ? "Perte rapide de valeur" : greeks.theta > 0 ? "Gain de valeur avec le temps" : "Perte modérée de valeur"}
              </TableCell>
            </TableRow>
            <TableRow className="hover:bg-finance-steel/10 border-finance-steel/20">
              <TableCell className="font-medium">Rho (ρ)</TableCell>
              <TableCell className={getSignClass(greeks.rho)}>
                {isLoading ? '...' : formatNumber(greeks.rho)}
              </TableCell>
              <TableCell className="text-xs text-finance-lightgray">
                {Math.abs(greeks.rho) < 0.1 ? "Peu sensible aux taux" : "Sensible aux taux"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default GreeksTable;
