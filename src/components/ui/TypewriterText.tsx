import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface TypewriterTextProps {
  content: string;
  isNew?: boolean;
}

export function TypewriterText({ content, isNew = false }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState(isNew ? '' : content);
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    if (!isNew) {
      setDisplayedText(content);
      return;
    }

    setDisplayedText('');
    const targetText = content;
    
    let startTime: number | null = null;
    let animationFrameId: number;

    // Fast typing time bound between 200ms and 500ms max total duration
    const duration = Math.min(500, Math.max(200, targetText.length * 0.8)); 

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Quadratic-out easing for a sleek premium mechanical ramp-down
      const easeProgress = 1 - Math.pow(1 - progress, 2);
      const currentLength = Math.floor(easeProgress * targetText.length);
      
      setDisplayedText(targetText.slice(0, currentLength));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayedText(targetText);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [content, isNew]);

  const isTyping = displayedText.length < content.length;

  return (
    <div className="relative leading-relaxed">
      <div className={`prose prose-invert max-w-none text-zinc-150 transition-opacity duration-200 ${isTyping ? 'opacity-95' : 'opacity-100'}`}>
        <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {displayedText}
        </Markdown>
      </div>
      {isTyping && (
        <span className="inline-flex items-center ml-1.5 select-none">
          <span className="inline-block w-1.5 h-3.5 rounded-sm bg-gradient-to-b from-yellow-400 to-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)] align-middle" />
          <span className="text-[9px] text-yellow-400/90 font-mono font-black uppercase tracking-widest ml-1.5 animate-pulse">
            TYPING
          </span>
        </span>
      )}
    </div>
  );
}
