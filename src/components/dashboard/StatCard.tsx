
import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

const StatCard = ({ icon: Icon, label, value }: StatCardProps) => (
  <div className="finance-card p-4">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-md bg-finance-burgundy/10">
        <Icon className="h-5 w-5 text-finance-accent" />
      </div>
      <div>
        <p className="text-finance-lightgray text-xs">{label}</p>
        <p className="text-finance-offwhite font-medium">{value}</p>
      </div>
    </div>
  </div>
);

export default StatCard;
