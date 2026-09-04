"use client";

import { useEffect, useState } from "react";

export function WordRotate({
  words,
  duration = 3000,
}: {
  words: string[];
  duration?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % words.length);
    }, duration);
    return () => window.clearInterval(timer);
  }, [duration, words]);

  const word = words[index] || "";
  return (
    <span className="word-rotate">
      <span className="word-rotate-value" key={word}>
        {word}
      </span>
    </span>
  );
}
