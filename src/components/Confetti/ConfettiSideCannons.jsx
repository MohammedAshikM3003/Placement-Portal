import React, { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

export default function ConfettiSideCannons({
  className = "",
  disabled = false,
  type = "button",
  onClick,
  fireSignal = 0,
  children = "Confetti",
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
      "#ff1744",
      "#ff9100",
      "#ffea00",
      "#00e676",
      "#00e5ff",
      "#2979ff",
      "#d500f9",
      "#ff4081",
    ];

    // Reduce particle count by 20%
    const baseParticleCount = 6;
    const particleCount = Math.max(1, Math.round(baseParticleCount * 0.8));

    // Smooth ramp-up + fade-out
    const duration = 2.5 * 1000; // total spawn duration (ms)
    const fadeDuration = 1000; // ms for smooth fade-out at end
    const startupDuration = 1000; // ms for smooth ramp-up at start
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
      let scalar = Math.max(0.3, 1.25 * (0.5 + totalFactor * 0.5));
      let startVelocityLeft = Math.max(8, Math.round(72 * totalFactor));
      let startVelocitySide = Math.max(6, Math.round(58 * totalFactor));

      if (spawnCount > 0) {
        confetti({
          particleCount: spawnCount,
          angle: 60,
          spread: 70,
          startVelocity: startVelocityLeft,
          origin: { x: 0, y: 0.5 },
          colors,
          scalar,
          zIndex: 9999,
        });
        confetti({
          particleCount: spawnCount,
          angle: 120,
          spread: 70,
          startVelocity: startVelocityLeft,
          origin: { x: 1, y: 0.5 },
          colors,
          scalar,
          zIndex: 9999,
        });
        confetti({
          particleCount: spawnCount,
          angle: 75,
          spread: 82,
          startVelocity: startVelocitySide,
          origin: { x: 0.18, y: 0.48 },
          colors,
          scalar,
          zIndex: 9999,
        });
        confetti({
          particleCount: spawnCount,
          angle: 105,
          spread: 82,
          startVelocity: startVelocitySide,
          origin: { x: 0.82, y: 0.48 },
          colors,
          scalar,
          zIndex: 9999,
        });
      }

      removeTimerRef.current = window.setTimeout(frame, 16);
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

    if (typeof onClick === "function") {
      onClick(event);
    }
  };

  return (
    <button type={type} className={className} onClick={handleClick} disabled={disabled}>
      {children}
    </button>
  );
}