
interface GitHubOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
}

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  email: string;
}

export class GitHubOAuthService {
  private config: GitHubOAuthConfig;

  constructor() {
    this.config = {
      clientId: 'your_github_client_id', // To be configured by user
      redirectUri: `${window.location.origin}/auth/github/callback`,
      scope: 'repo,user:email'
    };
  }

  generateAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
      state: this.generateState()
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  private generateState(): string {
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('github_oauth_state', state);
    return state;
  }

  validateState(state: string): boolean {
    const storedState = localStorage.getItem('github_oauth_state');
    localStorage.removeItem('github_oauth_state');
    return state === storedState;
  }

  async exchangeCodeForToken(code: string): Promise<string> {
    // Note: In production, this should be done through a backend service
    // This is a simplified version for demonstration
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: 'your_client_secret', // Should be on backend
          code: code,
        }),
      });

      const data: GitHubTokenResponse = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new Error('Failed to authenticate with GitHub');
    }
  }

  async getUserInfo(accessToken: string): Promise<GitHubUser> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user information');
    }

    return response.json();
  }

  initiateAuth(): void {
    const authUrl = this.generateAuthUrl();
    window.location.href = authUrl;
  }
}

export const githubOAuthService = new GitHubOAuthService();
