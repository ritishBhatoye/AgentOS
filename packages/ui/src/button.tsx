"use client";

import { ReactNode } from "react";
import { cn } from "@repo/utils";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  appName: string;
}

export const Button = ({ children, className, appName }: ButtonProps) => {
  return (
    <button
      className={cn("px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors", className)}
      onClick={() => alert(`Hello from your ${appName} app!`)}
    >
      {children}
    </button>
  );
};
