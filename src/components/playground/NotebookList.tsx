
import React from 'react';
import { Link } from 'react-router-dom';
import { NotebookItem } from '@/types/notebook';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, GitBranch, Calendar, ArrowUpRight } from 'lucide-react';

interface NotebookListProps {
  notebooks: NotebookItem[];
  isLoading: boolean;
  onSelect: (notebook: NotebookItem) => void;
  selectedId?: string;
}

const NotebookList: React.FC<NotebookListProps> = ({ 
  notebooks, 
  isLoading, 
  onSelect,
  selectedId
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (notebooks.length === 0) {
    return (
      <Card className="p-4 text-center">
        <p className="text-finance-lightgray">No notebooks found matching your criteria</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 overflow-auto max-h-[calc(100vh-200px)]">
      {notebooks.map(notebook => (
        <Card 
          key={notebook.id}
          className={`p-4 cursor-pointer transition-all hover:border-finance-accent ${
            selectedId === notebook.id ? 'border-finance-accent' : ''
          }`}
          onClick={() => onSelect(notebook)}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-finance-offwhite truncate">{notebook.name}</h3>
            <a 
              href={notebook.html_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-finance-accent hover:text-finance-accent/80"
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
          
          <div className="text-xs text-finance-lightgray mt-2 flex flex-wrap gap-1">
            {notebook.category?.map(cat => (
              <Badge key={cat} variant="outline" className="bg-finance-dark/50">
                {cat}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between mt-3 text-xs text-finance-lightgray">
            <div className="flex items-center">
              <img 
                src={notebook.repository.owner.avatar_url} 
                alt={notebook.repository.owner.login} 
                className="w-5 h-5 rounded-full mr-2"
              />
              <span>{notebook.repository.owner.login}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <Star className="h-3 w-3 mr-1 text-yellow-500" />
                <span>{notebook.repository.stargazers_count}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                <span>
                  {new Date(notebook.repository.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default NotebookList;
