
import { NotebookItem, NotebookContent } from '../types/notebook';

const GITHUB_API_URL = 'https://api.github.com';

// Function to search for notebooks on GitHub
export const searchNotebooks = async (query: string): Promise<NotebookItem[]> => {
  try {
    const searchQuery = encodeURIComponent(
      `${query} language:python extension:ipynb`
    );
    const response = await fetch(
      `${GITHUB_API_URL}/search/code?q=${searchQuery}&per_page=30`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    return data.items.map((item: any) => ({
      id: item.sha,
      name: item.name.replace('.ipynb', ''),
      path: item.path,
      repository: item.repository,
      html_url: item.html_url,
      download_url: `https://raw.githubusercontent.com/${item.repository.full_name}/${item.repository.default_branch || 'master'}/${item.path}`,
      category: detectCategory(item.name, item.path),
    }));
  } catch (error) {
    console.error('Error searching notebooks:', error);
    throw error;
  }
};

// Function to fetch notebook content by URL
export const fetchNotebookContent = async (url: string): Promise<NotebookContent> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch notebook: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching notebook content:', error);
    throw error;
  }
};

// Function to detect category based on notebook name and path
const detectCategory = (name: string, path: string): string[] => {
  const categories: string[] = [];
  const content = (name + path).toLowerCase();

  if (content.includes('europ') || content.includes('black') || content.includes('bs')) {
    categories.push('European');
  }
  if (content.includes('monte') || content.includes('mc') || content.includes('simulation')) {
    categories.push('Monte-Carlo');
  }
  if (content.includes('exotic') || content.includes('barrier') || content.includes('asian')) {
    categories.push('Exotic');
  }
  if (content.includes('backtest') || content.includes('back-test') || content.includes('backtesting')) {
    categories.push('Back-test');
  }

  return categories;
};

// Function to replace imports for TPL compatibility
export const replaceImportsForTPL = (notebookContent: NotebookContent): NotebookContent => {
  const updatedContent = { ...notebookContent };
  
  updatedContent.cells = notebookContent.cells.map(cell => {
    if (cell.cell_type === 'code') {
      const updatedSource = cell.source.map(line => {
        return line
          .replace(/import\s+QuantLib/g, 'import tpl as QuantLib')
          .replace(/from\s+quantlib\s+import/gi, 'from tpl import')
          .replace(/import\s+numpy/g, 'import numpy')
          .replace(/import\s+pandas/g, 'import pandas')
          .replace(/import\s+matplotlib/g, 'import matplotlib');
      });
      
      return { ...cell, source: updatedSource };
    }
    return cell;
  });
  
  return updatedContent;
};

// Function to create a GitHub Gist
export const createGist = async (
  notebookContent: NotebookContent,
  description: string,
  filename: string,
  token?: string
): Promise<string | null> => {
  if (!token) {
    console.error('GitHub token is required to create a gist');
    return null;
  }

  try {
    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description,
        public: false,
        files: {
          [filename]: {
            content: JSON.stringify(notebookContent, null, 2)
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create gist: ${response.status}`);
    }

    const data = await response.json();
    return data.html_url;
  } catch (error) {
    console.error('Error creating gist:', error);
    return null;
  }
};

// Function to encode notebook content for URL sharing
export const encodeNotebookForURL = (notebookContent: NotebookContent): string => {
  return btoa(encodeURIComponent(JSON.stringify(notebookContent)));
};

// Function to decode notebook content from URL
export const decodeNotebookFromURL = (encoded: string): NotebookContent | null => {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)));
  } catch (error) {
    console.error('Error decoding notebook from URL:', error);
    return null;
  }
};
