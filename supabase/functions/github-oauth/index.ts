import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'auth') {
      // Generate authorization URL
      const clientId = Deno.env.get('GITHUB_CLIENT_ID');
      if (!clientId) {
        throw new Error('GitHub Client ID not configured');
      }

      const redirectUri = `${url.origin}/auth/github/callback`;
      const scope = 'repo,user:email';
      const state = crypto.randomUUID();

      // Store state in session for validation
      const authUrl = `https://github.com/login/oauth/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${scope}&` +
        `state=${state}`;

      return new Response(
        JSON.stringify({ authUrl, state }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    if (action === 'exchange') {
      // Exchange code for token
      const { code, state } = await req.json();
      
      const clientId = Deno.env.get('GITHUB_CLIENT_ID');
      const clientSecret = Deno.env.get('GITHUB_CLIENT_SECRET');
      
      if (!clientId || !clientSecret) {
        throw new Error('GitHub OAuth credentials not configured');
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokenData: GitHubTokenResponse = await tokenResponse.json();

      // Get user information
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user information');
      }

      const userData: GitHubUser = await userResponse.json();

      // Store encrypted token in database (for demo purposes - in production use proper encryption)
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser.user) {
        await supabase
          .from('user_github_tokens')
          .upsert({
            user_id: authUser.user.id,
            github_user_id: userData.id,
            github_username: userData.login,
            access_token: tokenData.access_token, // Should be encrypted in production
            updated_at: new Date().toISOString()
          });
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: userData,
          // Don't return the token to the client
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );

  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});