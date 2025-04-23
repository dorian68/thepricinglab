
import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface CourseProgressProps {
  title: string;
  progress: number;
  lastActivity: string;
  level: string;
  path: string;
}

const CourseProgress = ({ 
  title, 
  progress, 
  lastActivity, 
  level,
  path 
}: CourseProgressProps) => (
  <Link to={path} className="finance-card p-4 hover:border-finance-accent/50 transition-colors duration-300">
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <h3 className="text-finance-offwhite font-medium text-sm">{title}</h3>
        <p className="text-finance-lightgray text-xs">{lastActivity}</p>
      </div>
      <span className="terminal-text text-xs px-2 py-0.5 bg-finance-steel/20 rounded text-finance-lightgray">
        {level}
      </span>
    </div>
    
    <div className="mb-2">
      <div className="h-1.5 bg-finance-steel/20 rounded-full overflow-hidden">
        <div 
          className="h-full bg-finance-accent rounded-full" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
    
    <div className="flex justify-between items-center">
      <span className="text-finance-lightgray text-xs">{progress}% complété</span>
      <button className="text-finance-accent flex items-center text-xs font-medium">
        Continuer <ChevronRight className="ml-1 h-3 w-3" />
      </button>
    </div>
  </Link>
);

export default CourseProgress;
