import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Wrench, FileText } from 'lucide-react';

export interface RelatedResource {
  title: string;
  description: string;
  path: string;
  type: 'course' | 'tool' | 'blog';
}

const iconMap = {
  course: BookOpen,
  tool: Wrench,
  blog: FileText,
};

const labelMap = {
  course: 'Course',
  tool: 'Tool',
  blog: 'Article',
};

interface RelatedResourcesProps {
  resources: RelatedResource[];
  title?: string;
}

const RelatedResources: React.FC<RelatedResourcesProps> = ({
  resources,
  title = 'Related Resources',
}) => {
  const navigate = useNavigate();

  return (
    <div>
      <h2 className="text-lg font-bold terminal-text mb-5">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((resource, i) => {
          const Icon = iconMap[resource.type];
          return (
            <button
              key={i}
              onClick={() => navigate(resource.path)}
              className="flex flex-col p-4 rounded-lg bg-card border border-border hover:border-primary/40 transition-all text-left group"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary uppercase tracking-wide">
                  {labelMap[resource.type]}
                </span>
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                {resource.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">{resource.description}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-primary font-medium">
                Explore <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedResources;
