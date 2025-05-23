
import React, { useState } from 'react';
import { NotebookContent } from '@/types/notebook';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { GitBranch, Share2, Copy, Check, Github } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotebookSharingProps {
  getShareableUrl: () => string | null;
  shareAsGist: (token: string, filename: string, description: string) => Promise<string | null>;
  notebookName: string;
}

const NotebookSharing: React.FC<NotebookSharingProps> = ({ 
  getShareableUrl, 
  shareAsGist,
  notebookName
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'url' | 'gist'>('url');
  const [shareableUrl, setShareableUrl] = useState<string | null>(null);
  const [githubToken, setGithubToken] = useState('');
  const [gistDescription, setGistDescription] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const handleShare = () => {
    const url = getShareableUrl();
    setShareableUrl(url);
    setDialogMode('url');
    setShowDialog(true);
  };

  const handleCreateGist = () => {
    setGistDescription(`TPL version of ${notebookName}`);
    setDialogMode('gist');
    setShowDialog(true);
  };

  const copyToClipboard = async () => {
    if (!shareableUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "URL copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive"
      });
    }
  };

  const handleSubmitGist = async () => {
    if (!githubToken) {
      toast({
        title: "Token required",
        description: "Please enter your GitHub personal access token",
        variant: "destructive"
      });
      return;
    }

    setIsSharing(true);
    
    try {
      const gistUrl = await shareAsGist(
        githubToken, 
        `${notebookName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ipynb`, 
        gistDescription || `TPL version of ${notebookName}`
      );
      
      if (gistUrl) {
        setShareableUrl(gistUrl);
        setDialogMode('url');
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 mt-4">
        <Button 
          variant="outline" 
          className="flex items-center"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share URL
        </Button>
        
        <Button 
          variant="outline" 
          className="flex items-center"
          onClick={handleCreateGist}
        >
          <GitBranch className="h-4 w-4 mr-2" />
          Create Gist
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'url' ? 'Share Notebook' : 'Create GitHub Gist'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'url' 
                ? 'Share this URL to let others view your notebook with TPL'
                : 'Create a GitHub Gist to share and version your notebook'
              }
            </DialogDescription>
          </DialogHeader>
          
          {dialogMode === 'url' && shareableUrl && (
            <div className="flex items-center space-x-2">
              <Input value={shareableUrl} readOnly className="flex-1" />
              <Button size="icon" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
          
          {dialogMode === 'gist' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="token" className="text-sm font-medium mb-1 block">
                  GitHub Personal Access Token
                </label>
                <Input 
                  id="token"
                  value={githubToken} 
                  onChange={(e) => setGithubToken(e.target.value)} 
                  type="password"
                  placeholder="ghp_..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  Need a token? <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-finance-accent hover:underline">Create one</a> with gist scope.
                </p>
              </div>
              
              <div>
                <label htmlFor="description" className="text-sm font-medium mb-1 block">
                  Gist Description
                </label>
                <Input 
                  id="description"
                  value={gistDescription} 
                  onChange={(e) => setGistDescription(e.target.value)} 
                />
              </div>
              
              <Button 
                onClick={handleSubmitGist} 
                className="w-full flex items-center justify-center"
                disabled={isSharing || !githubToken}
              >
                <Github className="h-4 w-4 mr-2" />
                {isSharing ? 'Creating...' : 'Create Gist'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotebookSharing;
