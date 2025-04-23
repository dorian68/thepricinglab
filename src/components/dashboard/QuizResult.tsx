
import React from "react";

interface QuizResultProps {
  title: string;
  score: number;
  date: string;
  correct: number;
  total: number;
}

const QuizResult = ({ title, score, date, correct, total }: QuizResultProps) => (
  <div className="finance-card p-4">
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-finance-offwhite font-medium text-sm">{title}</h3>
      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
        score >= 80 ? 'bg-green-900/20 text-green-400' : 
        score >= 60 ? 'bg-yellow-900/20 text-yellow-400' : 
        'bg-red-900/20 text-red-400'
      }`}>
        {score}%
      </span>
    </div>
    <p className="text-finance-lightgray text-xs mb-3">{date}</p>
    <div className="flex items-center">
      <span className="text-finance-lightgray text-xs">{correct}/{total} questions correctes</span>
    </div>
  </div>
);

export default QuizResult;
