
import { useState, useEffect } from 'react';
import { GitHubConnection, ProjectMetadata } from '../types/github';
import { GitHubService, createProjectMetadata } from '../services/githubService';

export const useGitHubConnection = () => {
  const [connection, setConnection] = useState<GitHubConnection>({
    isConnected: false
  });
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for saved GitHub connection
    const savedConnection = localStorage.getItem('github-connection');
    if (savedConnection) {
      try {
        const parsed = JSON.parse(savedConnection);
        setConnection(parsed);
      } catch (e) {
        console.warn('Invalid saved GitHub connection');
      }
    }

    // Load saved projects
    const savedProjects = localStorage.getItem('github-projects');
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        setProjects(parsed);
      } catch (e) {
        console.warn('Invalid saved projects');
      }
    }
  }, []);

  const connectWithUrl = async (repoUrl: string) => {
    setIsLoading(true);
    try {
      const githubService = new GitHubService();
      const metadata = await createProjectMetadata(repoUrl);
      
      const newProjects = [...projects, metadata];
      setProjects(newProjects);
      localStorage.setItem('github-projects', JSON.stringify(newProjects));
      
      return metadata;
    } catch (error) {
      throw new Error(`Failed to add project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const removeProject = (projectId: string) => {
    const filtered = projects.filter(p => p.id !== projectId);
    setProjects(filtered);
    localStorage.setItem('github-projects', JSON.stringify(filtered));
  };

  const searchCommunityProjects = async (query?: string) => {
    setIsLoading(true);
    try {
      const githubService = new GitHubService();
      const repos = await githubService.searchPythonRepos(query);
      
      // Convert first 10 repos to project metadata
      const projectPromises = repos.slice(0, 10).map(repo => 
        createProjectMetadata(repo.html_url, undefined, githubService)
      );
      
      return await Promise.all(projectPromises);
    } catch (error) {
      console.error('Failed to search community projects:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    connection,
    projects,
    isLoading,
    connectWithUrl,
    removeProject,
    searchCommunityProjects,
  };
};
