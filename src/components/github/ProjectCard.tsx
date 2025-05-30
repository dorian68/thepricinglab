
import React from 'react';
import { Link } from 'react-router-dom';
import { ProjectMetadata } from '../../types/github';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Github, Star, Calendar, User, Play, ExternalLink } from 'lucide-react';

interface ProjectCardProps {
  project: ProjectMetadata;
  onRemove?: (projectId: string) => void;
  showRemove?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onRemove, 
  showRemove = false 
}) => {
  const handlePlaygroundOpen = () => {
    // Store project data for playground
    localStorage.setItem('playground-project', JSON.stringify(project));
  };

  return (
    <Card className="h-full hover:border-finance-accent transition-colors group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <Github className="h-4 w-4 text-finance-accent flex-shrink-0" />
            <CardTitle className="text-lg truncate">{project.repoName}</CardTitle>
          </div>
          {showRemove && onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(project.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </Button>
          )}
        </div>
        
        <div className="flex items-center text-finance-lightgray text-sm">
          <img 
            src={project.authorAvatar} 
            alt={project.author}
            className="w-4 h-4 rounded-full mr-2"
          />
          <span className="truncate">{project.author}</span>
          {project.forkedBy && (
            <>
              <span className="mx-2">•</span>
              <span className="text-finance-accent text-xs">
                Forké par {project.forkedBy}
              </span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-finance-lightgray text-sm line-clamp-3 mb-3">
          {project.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {project.tags.slice(0, 4).map((tag, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-xs bg-finance-steel/20 text-finance-lightgray"
            >
              {tag}
            </Badge>
          ))}
          {project.tags.length > 4 && (
            <Badge variant="secondary" className="text-xs bg-finance-steel/20 text-finance-lightgray">
              +{project.tags.length - 4}
            </Badge>
          )}
        </div>

        <div className="flex items-center text-finance-lightgray text-xs">
          <Calendar className="h-3 w-3 mr-1" />
          <span>Mis à jour {new Date(project.lastModified).toLocaleDateString('fr-FR')}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-finance-steel/20">
        <div className="flex gap-2 w-full">
          <Button
            asChild
            variant="finance"
            size="sm"
            className="flex-1"
            onClick={handlePlaygroundOpen}
          >
            <Link to={`/community/playground?project=${encodeURIComponent(project.id)}`}>
              <Play className="h-3 w-3 mr-1" />
              Ouvrir dans Playground
            </Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <a 
              href={project.repoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </a>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
