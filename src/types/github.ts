
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  topics: string[];
}

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url?: string;
  content?: string;
}

export interface ProjectMetadata {
  id: string;
  repoUrl: string;
  repoName: string;
  author: string;
  authorAvatar: string;
  description: string;
  readme?: string;
  tags: string[];
  forkedBy?: string;
  files: GitHubFile[];
  lastModified: string;
}

export interface GitHubConnection {
  isConnected: boolean;
  username?: string;
  avatar?: string;
  accessToken?: string;
}
