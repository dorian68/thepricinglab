
export interface NotebookRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface NotebookItem {
  id: string;
  name: string;
  path: string;
  repository: NotebookRepository;
  html_url: string;
  download_url: string;
  content?: string;
  category?: string[];
}

export interface NotebookCell {
  cell_type: 'markdown' | 'code' | 'raw';
  source: string[];
  metadata?: any;
  execution_count?: number | null;
  outputs?: any[];
}

export interface NotebookContent {
  cells: NotebookCell[];
  metadata: any;
  nbformat: number;
  nbformat_minor: number;
}

export interface NotebookViewerProps {
  notebook: NotebookContent | null;
  isLoading: boolean;
  error: string | null;
}

export interface NotebookFilter {
  query: string;
  category: string;
}
