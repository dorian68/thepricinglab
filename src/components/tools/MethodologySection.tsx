import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, FlaskConical } from 'lucide-react';

export interface MethodologyItem {
  label: string;
  content: string;
}

interface MethodologySectionProps {
  items: MethodologyItem[];
  title?: string;
}

const MethodologySection: React.FC<MethodologySectionProps> = ({
  items,
  title = 'Methodology & Assumptions',
}) => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <FlaskConical className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold terminal-text">{title}</h2>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <Collapsible key={i}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-md bg-card border border-border hover:border-primary/30 transition-colors text-left group">
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pt-2 pb-3">
              <p className="text-sm text-muted-foreground leading-relaxed">{item.content}</p>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};

export default MethodologySection;
