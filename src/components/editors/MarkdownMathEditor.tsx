
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List, Code, Image, Link as LinkIcon } from 'lucide-react';
import 'katex/dist/katex.min.css';
import MarkdownMathRenderer from './MarkdownMathRenderer';

interface MarkdownMathEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: string;
}

const MarkdownMathEditor: React.FC<MarkdownMathEditorProps> = ({
  value,
  onChange,
  placeholder = 'Écrivez votre contenu ici...',
  className = '',
  height = 'min-h-[300px]'
}) => {
  const [isEditing, setIsEditing] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const insertAtCursor = useCallback((textToInsert: string, selectionOffset = 0) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    onChange(before + textToInsert + after);
    
    // This needs to be done after the state is updated
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + selectionOffset, start + selectionOffset);
    }, 0);
  }, [onChange]);

  const insertHeader = () => insertAtCursor('## ', 3);
  const insertBold = () => insertAtCursor('**texte en gras**', 2);
  const insertItalic = () => insertAtCursor('*texte en italique*', 1);
  const insertList = () => insertAtCursor('\n- Élément de liste\n- Autre élément\n', 2);
  const insertLink = () => insertAtCursor('[texte du lien](https://example.com)', 1);
  const insertImage = () => insertAtCursor('![description](https://example.com/image.jpg)', 2);
  const insertCode = () => insertAtCursor('\n```\ncode ici\n```\n', 5);
  const insertMath = () => insertAtCursor('$$\nx = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\n$$', 4);
  const insertMermaidDiagram = () => insertAtCursor('\n```mermaid\ngraph TD\n  A[Start] --> B[End]\n```\n', 20);

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      <div className="flex flex-wrap gap-2 bg-finance-charcoal p-2 rounded-md">
        <Button variant="outline" size="sm" onClick={insertHeader} title="Titre">
          H2
        </Button>
        <Button variant="outline" size="sm" onClick={insertBold} title="Gras">
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={insertItalic} title="Italique">
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={insertList} title="Liste">
          <List className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={insertLink} title="Lien">
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={insertImage} title="Image">
          <Image className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={insertCode} title="Bloc de code">
          <Code className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={insertMath} title="Formule mathématique">
          𝑓(x)
        </Button>
        <Button variant="outline" size="sm" onClick={insertMermaidDiagram} title="Diagramme Mermaid">
          📊
        </Button>
        <div className="ml-auto">
          <Button
            variant={isEditing ? "outline" : "default"}
            size="sm"
            onClick={() => setIsEditing(true)}
            className={isEditing ? 'bg-finance-steel/20' : ''}
          >
            Éditer
          </Button>
          <Button
            variant={!isEditing ? "outline" : "default"}
            size="sm"
            onClick={() => setIsEditing(false)}
            className={!isEditing ? 'bg-finance-steel/20' : ''}
          >
            Aperçu
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {isEditing ? (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextareaChange}
            placeholder={placeholder}
            className={`w-full font-mono ${height} p-4 resize-none`}
          />
        ) : (
          <div className={`w-full prose prose-invert prose-pre:bg-finance-steel/10 prose-pre:p-4 prose-pre:rounded-md max-w-none ${height} overflow-y-auto border border-finance-steel/20 rounded-md p-4`}>
            <MarkdownMathRenderer content={value} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownMathEditor;
