
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';

interface NotebookFiltersProps {
  onFilterChange: (category: string) => void;
  onSearchChange: (query: string) => void;
  categories: string[];
  activeCategory: string;
  isLoading: boolean;
}

const NotebookFilters: React.FC<NotebookFiltersProps> = ({ 
  onFilterChange, 
  onSearchChange, 
  categories, 
  activeCategory,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    onSearchChange(searchQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search notebooks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
          disabled={isLoading}
        />
        <Button variant="outline" onClick={handleSearch} disabled={isLoading}>
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {['All', ...categories].map((category) => (
          <Button
            key={category}
            size="sm"
            variant={activeCategory === category ? "finance" : "outline"}
            onClick={() => onFilterChange(category)}
            disabled={isLoading}
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default NotebookFilters;
