
import { useState, useEffect, useCallback } from 'react';
import { NotebookItem, NotebookFilter } from '../types/notebook';
import { searchNotebooks } from '../services/notebookService';
import { useToast } from './use-toast';

export const useNotebookSearch = () => {
  const [notebooks, setNotebooks] = useState<NotebookItem[]>([]);
  const [filteredNotebooks, setFilteredNotebooks] = useState<NotebookItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotebookFilter>({
    query: 'option pricing notebook',
    category: 'All'
  });
  
  const { toast } = useToast();

  const fetchNotebooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await searchNotebooks(filter.query);
      setNotebooks(results);
      applyFilter(results, filter.category);
    } catch (err) {
      setError('Failed to fetch notebooks. Please try again later.');
      toast({
        title: 'Error',
        description: 'Failed to fetch notebooks from GitHub',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [filter.query, toast]);

  const applyFilter = (notebookList: NotebookItem[], category: string) => {
    if (category === 'All') {
      setFilteredNotebooks(notebookList);
    } else {
      setFilteredNotebooks(
        notebookList.filter(notebook => 
          notebook.category?.includes(category)
        )
      );
    }
  };

  const updateFilter = (newFilter: Partial<NotebookFilter>) => {
    setFilter(prev => {
      const updated = { ...prev, ...newFilter };
      if (newFilter.category && notebooks.length > 0) {
        applyFilter(notebooks, updated.category);
      }
      return updated;
    });
  };

  useEffect(() => {
    fetchNotebooks();
  }, [fetchNotebooks]);

  return {
    notebooks: filteredNotebooks,
    isLoading,
    error,
    filter,
    updateFilter,
    refreshNotebooks: fetchNotebooks
  };
};
