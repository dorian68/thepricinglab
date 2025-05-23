
import { useState, useEffect, useCallback } from 'react';
import { NotebookContent } from '../types/notebook';
import { fetchNotebookContent, replaceImportsForTPL, createGist, encodeNotebookForURL } from '../services/notebookService';
import { useToast } from './use-toast';

export const useNotebook = (url?: string) => {
  const [notebook, setNotebook] = useState<NotebookContent | null>(null);
  const [tplNotebook, setTplNotebook] = useState<NotebookContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchNotebook = useCallback(async (notebookUrl: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const content = await fetchNotebookContent(notebookUrl);
      setNotebook(content);
      
      // Also create TPL version
      const tplVersion = replaceImportsForTPL(content);
      setTplNotebook(tplVersion);
      
      // Save to localStorage for potential offline use
      localStorage.setItem('last-notebook', JSON.stringify(content));
    } catch (err) {
      setError('Failed to fetch notebook content');
      toast({
        title: "Error",
        description: "Failed to load notebook content",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const shareNotebookAsGist = useCallback(async (githubToken: string, filename: string, description: string) => {
    if (!tplNotebook) return null;
    
    try {
      const gistUrl = await createGist(tplNotebook, description, filename, githubToken);
      if (gistUrl) {
        toast({
          title: "Success",
          description: "Notebook saved as GitHub Gist",
        });
        return gistUrl;
      }
      return null;
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create GitHub Gist",
        variant: "destructive"
      });
      return null;
    }
  }, [tplNotebook, toast]);
  
  const getShareableUrl = useCallback(() => {
    if (!tplNotebook) return null;
    
    try {
      const encoded = encodeNotebookForURL(tplNotebook);
      const shareableUrl = `${window.location.origin}/community/playground/shared?notebook=${encoded}`;
      return shareableUrl;
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to generate shareable URL",
        variant: "destructive"
      });
      return null;
    }
  }, [tplNotebook, toast]);

  useEffect(() => {
    if (url) {
      fetchNotebook(url);
    }
  }, [url, fetchNotebook]);

  return {
    notebook,
    tplNotebook,
    isLoading,
    error,
    fetchNotebook,
    shareNotebookAsGist,
    getShareableUrl
  };
};
