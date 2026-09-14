"use client";

import React, { useState, useEffect } from "react";

interface TextTypeProps {
  text: string | string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  loop?: boolean;
  showCursor?: boolean;
  cursorChar?: string;
  className?: string;
  cursorClassName?: string;
}

export function TextType({
  text,
  typingSpeed = 30,
  deletingSpeed = 15,
  pauseDuration = 3000,
  loop = true,
  showCursor = true,
  cursorChar = "|",
  className = "",
  cursorClassName = "",
}: TextTypeProps) {
  const strings = Array.isArray(text) ? text : [text];
  const [currentStringIndex, setCurrentStringIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const currentFullText = strings[currentStringIndex] || "";

    if (!isDeleting) {
      if (displayedText.length < currentFullText.length) {
        timeout = setTimeout(() => {
          setDisplayedText(currentFullText.slice(0, displayedText.length + 1));
        }, typingSpeed);
      } else if (loop && strings.length > 1) {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
      }
    } else {
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedText(currentFullText.slice(0, displayedText.length - 1));
        }, deletingSpeed);
      } else {
        setIsDeleting(false);
        setCurrentStringIndex((prev) => (prev + 1) % strings.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentStringIndex, strings, typingSpeed, deletingSpeed, pauseDuration, loop]);

  return (
    <span className={`inline ${className}`}>
      <span>{displayedText}</span>
      {showCursor && (
        <span
          className={`inline-block animate-pulse font-mono ml-0.5 text-[#0080ff] sm:text-[#ff6600] font-bold ${cursorClassName}`}
        >
          {cursorChar}
        </span>
      )}
    </span>
  );
}
