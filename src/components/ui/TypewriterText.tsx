import React, { useState, useEffect, useRef, useMemo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface TypewriterTextProps {
  content: string;
  isNew?: boolean;
}

export const TypewriterText: React.FC<TypewriterTextProps> = React.memo(({ content, isNew = false }) => {
  const [displayedLength, setDisplayedLength] = useState(() => (isNew ? 0 : content.length));
  const hasAnimatedRef = useRef(!isNew);
  const prevContentRef = useRef(content);

  useEffect(() => {
    // If content changes or it's a completely new message that hasn't animated yet
    if (prevContentRef.current !== content) {
      prevContentRef.current = content;
      if (!isNew) {
        setDisplayedLength(content.length);
        hasAnimatedRef.current = true;
        return;
      }
    }

    if (!isNew || hasAnimatedRef.current) {
      setDisplayedLength(content.length);
      return;
    }

    // Smooth chunked progressive reveal without markdown AST thrashing
    const targetLength = content.length;
    if (targetLength === 0) {
      setDisplayedLength(0);
      return;
    }

    // Calculate step size and interval for a smooth, natural flow
    // Total animation between 150ms (short) and 450ms (long)
    const duration = Math.min(450, Math.max(150, targetLength * 0.4));
    const stepInterval = 24; // ~40 fps token tick
    const totalSteps = Math.max(1, Math.floor(duration / stepInterval));
    const charsPerStep = Math.max(1, Math.ceil(targetLength / totalSteps));

    let currentLength = 0;
    const timer = setInterval(() => {
      currentLength = Math.min(targetLength, currentLength + charsPerStep);
      setDisplayedLength(currentLength);

      if (currentLength >= targetLength) {
        clearInterval(timer);
        hasAnimatedRef.current = true;
      }
    }, stepInterval);

    return () => {
      clearInterval(timer);
    };
  }, [content, isNew]);

  const visibleText = useMemo(() => {
    if (displayedLength >= content.length) return content;
    return content.slice(0, displayedLength);
  }, [content, displayedLength]);

  const isTyping = displayedLength < content.length;

  return (
    <div className="relative leading-relaxed select-text">
      <div
        className={`prose prose-invert max-w-none text-zinc-100 transition-opacity duration-150 ${
          isTyping ? 'opacity-95' : 'opacity-100'
        }`}
      >
        <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {visibleText}
        </Markdown>
      </div>
      {isTyping && (
        <span className="inline-flex items-center ml-1.5 select-none align-middle">
          <span className="inline-block w-1.5 h-3.5 rounded-sm bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
        </span>
      )}
    </div>
  );
});

export default TypewriterText;
