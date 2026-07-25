import React, { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

export default function ConfettiSideCannons({
  className = "",
  disabled = false,
  type = "button",
  onClick,
  fireSignal = 0,
  children = null,
  style,
  ...props
}) {
  const removeTimerRef = useRef(null);
  const lastFireSignalRef = useRef(fireSignal);

  useEffect(() => {
    return () => {
      if (removeTimerRef.current) {
        clearTimeout(removeTimerRef.current);
        removeTimerRef.current = null;
      }
      confetti.reset();
    };
  }, []);

  const fireConfetti = () => {
    if (removeTimerRef.current) {
      clearTimeout(removeTimerRef.current);
      removeTimerRef.current = null;
    }

    confetti.reset();

    const colors = [
      "#2085F6", // Royal Blue
      "#00e676", // Vibrant Green
      "#ff1744", // Crimson Red
      "#ffea00", // Bright Yellow
      "#d500f9", // Neon Purple
      "#00e5ff", // Electric Cyan
      "#ff9100", // Vibrant Orange
      "#4EA24E", // Emerald Green
    ];

    // Check if mobile display (< 768px)
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    // Particle count: 5 on mobile so all 8 colors fire in equal proportion
    const baseParticleCount = isMobile ? 5 : 6;
    const particleCount = Math.max(1, Math.round(baseParticleCount * 0.8));

    // Smooth ramp-up + fade-out (mobile duration reduced by 10%)
    const duration = isMobile ? 1.35 * 1000 : 1.7 * 1000; // total spawn duration (ms)
    const fadeDuration = isMobile ? 600 : 700; // ms for smooth fade-out at end
    const startupDuration = isMobile ? 450 : 500; // ms for smooth ramp-up at start
    const start = Date.now();
    const end = start + duration;
    const stopSpawningAt = end - fadeDuration;

    const frame = () => {
      const now = Date.now();
      if (now > end) {
        removeTimerRef.current = null;
        return;
      }

      // Apply ramp-up (start) and ramp-down (fade) factors
      const sinceStart = now - start;
      const rampIn = startupDuration > 0 ? Math.min(1, Math.max(0, sinceStart / startupDuration)) : 1;

      let rampOut = 1;
      if (now > stopSpawningAt) {
        rampOut = Math.max(0, (end - now) / fadeDuration); // 1 -> 0
      }

      const totalFactor = rampIn * rampOut;

      let spawnCount = Math.round(particleCount * totalFactor);
      let scalar = Math.max(0.4, 1.25 * (0.5 + totalFactor * 0.5));
      if (isMobile) scalar *= 0.95;

      let startVelocityLeft = Math.max(10, Math.round((isMobile ? 58 : 72) * totalFactor));
      let startVelocitySide = Math.max(6, Math.round(58 * totalFactor));

      if (totalFactor > 0.05) {
        // Spawn exact equal count per color on every animation frame
        const countPerColor = 1;

        colors.forEach((color) => {
          // 1. Left side cannon
          confetti({
            particleCount: countPerColor,
            angle: 60,
            spread: isMobile ? 55 : 70,
            startVelocity: startVelocityLeft,
            origin: { x: 0, y: isMobile ? 0.6 : 0.5 },
            colors: [color],
            scalar,
            zIndex: 99999,
          });

          // 2. Right side cannon
          confetti({
            particleCount: countPerColor,
            angle: 120,
            spread: isMobile ? 55 : 70,
            startVelocity: startVelocityLeft,
            origin: { x: 1, y: isMobile ? 0.6 : 0.5 },
            colors: [color],
            scalar,
            zIndex: 99999,
          });

          // 3 & 4. Additional secondary cannons on desktop screens only (>= 768px)
          if (!isMobile) {
            confetti({
              particleCount: countPerColor,
              angle: 75,
              spread: 82,
              startVelocity: startVelocitySide,
              origin: { x: 0.18, y: 0.48 },
              colors: [color],
              scalar,
              zIndex: 99999,
            });
            confetti({
              particleCount: countPerColor,
              angle: 105,
              spread: 82,
              startVelocity: startVelocitySide,
              origin: { x: 0.82, y: 0.48 },
              colors: [color],
              scalar,
              zIndex: 99999,
            });
          }
        });
      }

      // Throttled frame delay (36ms on mobile vs 32ms on desktop) to reduce mobile paper count by 10%
      removeTimerRef.current = window.setTimeout(frame, isMobile ? 36 : 32);
    };

    frame();
  };

  useEffect(() => {
    if (fireSignal === lastFireSignalRef.current) return;
    lastFireSignalRef.current = fireSignal;
    if (fireSignal > 0) {
      fireConfetti();
    }
  }, [fireSignal]);

  const handleClick = (event) => {
    if (disabled) return;
    fireConfetti();
    if (typeof onClick === "function") {
      onClick(event);
    }
  };

  if (!children) {
    return null;
  }

  return (
    <button type={type} className={className} onClick={handleClick} disabled={disabled} style={style} {...props}>
      {children}
    </button>
  );
}