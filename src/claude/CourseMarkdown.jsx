import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

export default function CourseMarkdown({ children, tables = false }) {
  const content = String(children || '').replace(/<!--[\s\S]*?-->/g, '');
  return <ReactMarkdown remarkPlugins={tables ? [remarkGfm, remarkMath] : [remarkMath]} rehypePlugins={[rehypeKatex]}>{content}</ReactMarkdown>;
}
