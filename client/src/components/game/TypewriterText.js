import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * TypewriterText — types text character-by-character.
 * Props:
 *   text: string to display
 *   speed: chars per second (default 28)
 *   onComplete: called when typing finishes
 *   onAdvance: called when user clicks after text is complete
 */
export default function TypewriterText({ text, speed = 28, onComplete, onAdvance }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    // Reset on new text
    setDisplayedText('');
    setIsComplete(false);
    indexRef.current = 0;

    if (!text) return;

    const msPerChar = 1000 / speed;
    intervalRef.current = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= text.length) {
        setDisplayedText(text);
        setIsComplete(true);
        clearInterval(intervalRef.current);
        if (onComplete) onComplete();
      } else {
        setDisplayedText(text.slice(0, indexRef.current));
      }
    }, msPerChar);

    return () => clearInterval(intervalRef.current);
  }, [text, speed]); // eslint-disable-line

  const handleClick = useCallback(() => {
    if (!isComplete) {
      // Skip to end
      clearInterval(intervalRef.current);
      setDisplayedText(text);
      setIsComplete(true);
      if (onComplete) onComplete();
    } else {
      // Advance to next
      if (onAdvance) onAdvance();
    }
  }, [isComplete, text, onComplete, onAdvance]);

  return (
    <div className="typewriter" onClick={handleClick}>
      <span className="typewriter__text">{displayedText}</span>
      {isComplete && <span className="typewriter__cursor">▼</span>}
    </div>
  );
}
