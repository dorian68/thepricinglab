
import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';
import 'katex/dist/katex.min.css';

interface MarkdownMathRendererProps {
  content: string;
  className?: string;
}

const MarkdownMathRenderer: React.FC<MarkdownMathRendererProps> = ({ 
  content,
  className = ''
}) => {
  const mermaidContainerRef = useRef<HTMLDivElement>(null);

  // Initialize mermaid when the component mounts
  useEffect(() => {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose'
      });
    } catch (error) {
      console.error("Error initializing mermaid:", error);
    }
  }, []);

  // Process mermaid diagrams after the content is rendered
  useEffect(() => {
    if (mermaidContainerRef.current) {
      try {
        const mermaidDiagrams = mermaidContainerRef.current.querySelectorAll('.language-mermaid');
        if (mermaidDiagrams.length > 0) {
          // Use type assertion to solve the TypeScript error and wrap in try/catch
          try {
            mermaid.init(undefined, mermaidDiagrams as NodeListOf<HTMLElement>);
          } catch (error) {
            console.error('Mermaid diagram rendering error:', error);
          }
        }
      } catch (error) {
        console.error("Error processing mermaid diagrams:", error);
      }
    }
  }, [content]);

  // Handle null or undefined content gracefully
  const safeContent = content || '';

  return (
    <div ref={mermaidContainerRef} className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]} 
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return match && match[1] === 'mermaid' ? (
              <div className="language-mermaid">
                {String(children).replace(/\n$/, '')}
              </div>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMathRenderer;
