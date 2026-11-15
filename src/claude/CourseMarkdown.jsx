import React,{useLayoutEffect,useRef,useState} from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

function DisplayEquation({children,className,...props}){
  const ref=useRef(null),[scrollable,setScrollable]=useState(false);
  useLayoutEffect(()=>{
    const node=ref.current;let active=true;
    const measure=()=>{if(active&&node)setScrollable(node.scrollWidth>node.clientWidth+1);};
    measure();const observer=new ResizeObserver(measure);if(node)observer.observe(node);
    // Font metrics can change the content width without changing the block.
    document.fonts?.ready.then(measure);
    return()=>{active=false;observer.disconnect();};
  },[children]);
  return <span {...props} ref={ref} className={className} style={{...props.style,maxWidth:'100%',overflowX:'auto'}} tabIndex={scrollable?0:undefined} role={scrollable?'region':undefined} aria-label={scrollable?'Mathematical equation · scroll horizontally':undefined}>{children}</span>;
}
const components={span:({node,className,children,...props})=>String(className||'').split(/\s+/).includes('katex-display')?<DisplayEquation {...props} className={className}>{children}</DisplayEquation>:<span {...props} className={className}>{children}</span>};

export default function CourseMarkdown({ children, tables = false }) {
  const content = String(children || '').replace(/<!--[\s\S]*?-->/g, '');
  return <ReactMarkdown components={components} remarkPlugins={tables ? [remarkGfm, remarkMath] : [remarkMath]} rehypePlugins={[rehypeKatex]}>{content}</ReactMarkdown>;
}
