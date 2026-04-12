'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export function AchievementCelebration({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return;
    const duration = 1200;
    const end = Date.now() + duration;
    const colors = ['#E7A9B4', '#F6D6DC', '#B85C6B'];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [active]);

  return null;
}
