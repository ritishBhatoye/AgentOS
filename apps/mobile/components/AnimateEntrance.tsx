import React from 'react';
import { MotiView } from 'moti';

interface AnimateEntranceProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  initialScale?: number;
  initialY?: number;
}

export const AnimateEntrance = ({
  children,
  delay = 0,
  duration = 500,
  initialScale = 0.95,
  initialY = 10,
}: AnimateEntranceProps) => {
  return (
    <MotiView
      from={{
        opacity: 0,
        scale: initialScale,
        translateY: initialY,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        translateY: 0,
      }}
      transition={{
        type: 'timing',
        duration,
        delay,
      }}
    >
      {children}
    </MotiView>
  );
};
