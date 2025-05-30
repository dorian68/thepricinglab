
import { GitHubRepo, GitHubFile, ProjectMetadata } from '../types/github';

const GITHUB_API_BASE = 'https://api.github.com';

export class GitHubService {
  private accessToken?: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken;
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `token ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getRepoFromUrl(repoUrl: string): Promise<GitHubRepo> {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub URL format');
    }

    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, '');
    
    return this.fetchWithAuth(`${GITHUB_API_BASE}/repos/${owner}/${cleanRepo}`);
  }

  async getRepoFiles(owner: string, repo: string, path: string = ''): Promise<GitHubFile[]> {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;
    const contents = await this.fetchWithAuth(url);
    
    return Array.isArray(contents) ? contents : [contents];
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;
    const file = await this.fetchWithAuth(url);
    
    if (file.content) {
      return atob(file.content.replace(/\n/g, ''));
    }
    
    throw new Error('File content not available');
  }

  async searchPythonRepos(query: string = 'python finance quantitative'): Promise<GitHubRepo[]> {
    const searchQuery = `${query} language:python`;
    const url = `${GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc&per_page=20`;
    
    const result = await this.fetchWithAuth(url);
    return result.items || [];
  }

  async getUserRepos(): Promise<GitHubRepo[]> {
    if (!this.accessToken) {
      throw new Error('Authentication required');
    }
    
    return this.fetchWithAuth(`${GITHUB_API_BASE}/user/repos?sort=updated&per_page=50`);
  }

  extractProjectTags(repo: GitHubRepo, readme?: string): string[] {
    const tags = new Set<string>();
    
    // Tags from GitHub topics
    if (repo.topics) {
      repo.topics.forEach(topic => tags.add(topic));
    }
    
    // Tags from language
    if (repo.language) {
      tags.add(repo.language.toLowerCase());
    }
    
    // Tags from description and readme
    const text = `${repo.description || ''} ${readme || ''}`.toLowerCase();
    
    const keywords = [
      'machine learning', 'ml', 'pricing', 'quantitative', 'finance',
      'backtesting', 'trading', 'options', 'derivatives', 'risk',
      'portfolio', 'monte carlo', 'black scholes', 'volatility'
    ];
    
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.add(keyword.replace(' ', '-'));
      }
    });
    
    return Array.from(tags);
  }
}

export const createProjectMetadata = async (
  repoUrl: string, 
  forkedBy?: string,
  githubService?: GitHubService
): Promise<ProjectMetadata> => {
  const service = githubService || new GitHubService();
  const repo = await service.getRepoFromUrl(repoUrl);
  
  const [owner, repoName] = repo.full_name.split('/');
  
  // Get files
  const files = await service.getRepoFiles(owner, repoName);
  
  // Try to get README
  let readme = '';
  const readmeFile = files.find(f => 
    f.name.toLowerCase().startsWith('readme') && f.type === 'file'
  );
  
  if (readmeFile) {
    try {
      readme = await service.getFileContent(owner, repoName, readmeFile.path);
    } catch (e) {
      console.warn('Could not fetch README:', e);
    }
  }
  
  const tags = service.extractProjectTags(repo, readme);
  
  return {
    id: `${repo.id}`,
    repoUrl: repo.html_url,
    repoName: repo.name,
    author: repo.owner.login,
    authorAvatar: repo.owner.avatar_url,
    description: repo.description || 'No description available',
    readme,
    tags,
    forkedBy,
    files,
    lastModified: repo.updated_at,
  };
};
