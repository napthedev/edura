"use client";

import React from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import clsx from "clsx";

// MathJax configuration
const mathJaxConfig = {
  loader: { load: ["[tex]/html"] },
  tex: {
    packages: { "[+]": ["html"] },
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"],
    ],
    displayMath: [
      ["$$", "$$"],
      ["\\[", "\\]"],
    ],
  },
  options: {
    enableMenu: false,
  },
};

// Helper component to render text with LaTeX
export const LaTeXRenderer: React.FC<{
  children: string;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <MathJax className={clsx(className, "!inline-block")}>{children}</MathJax>
  );
};

// Wrapper component that provides MathJax context
export const MathJaxProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <MathJaxContext config={mathJaxConfig}>{children}</MathJaxContext>;
};
