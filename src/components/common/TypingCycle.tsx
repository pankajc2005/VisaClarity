import { useEffect, useState } from "react";

interface TypingCycleProps {
  phrases: string[];
  className?: string;
  typeSpeed?: number;
  deleteSpeed?: number;
  pauseMs?: number;
}

/**
 * Typewriter that cycles through phrases — types, pauses, deletes, repeats.
 * SSR-safe: renders the first phrase statically until mounted.
 */
export function TypingCycle({
  phrases,
  className,
  typeSpeed = 75,
  deleteSpeed = 40,
  pauseMs = 1600,
}: TypingCycleProps) {
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  const [text, setText] = useState(phrases[0] ?? "");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
    setText("");
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const current = phrases[index % phrases.length];

    if (!deleting && text === current) {
      const t = setTimeout(() => setDeleting(true), pauseMs);
      return () => clearTimeout(t);
    }

    if (deleting && text === "") {
      setDeleting(false);
      setIndex((i) => (i + 1) % phrases.length);
      return;
    }

    const t = setTimeout(
      () => {
        setText((prev) =>
          deleting ? current.slice(0, prev.length - 1) : current.slice(0, prev.length + 1),
        );
      },
      deleting ? deleteSpeed : typeSpeed,
    );
    return () => clearTimeout(t);
  }, [text, deleting, index, mounted, phrases, typeSpeed, deleteSpeed, pauseMs]);

  // Reserve space for the longest phrase to prevent layout shift while typing/deleting
  const longest = phrases.reduce((a, b) => (b.length > a.length ? b : a), "");

  return (
    <span className={`relative inline-grid align-baseline ${className ?? ""}`} aria-live="polite">
      <span aria-hidden className="invisible whitespace-pre-wrap col-start-1 row-start-1">
        {longest}
      </span>
      <span className="col-start-1 row-start-1 whitespace-pre-wrap">
        {text}
        <span
          aria-hidden
          className="inline-block w-[0.06em] h-[0.85em] align-[-0.1em] ml-1 bg-current animate-pulse"
        />
      </span>
    </span>
  );
}
