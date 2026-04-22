import React, { useEffect, useRef } from "react";

export default function ExactDiwaliBurst({ isActive = true }) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return undefined;
    }

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const bursts = [];
    const rockets = [];

    const palettes = [
      ["#ff1493", "#d4c6a1"],
      ["#00ff99", "#e6d27a"],
      ["#f7b6d2", "#ffffff"],
      ["#ff9800", "#ffe082"],
      ["#00bcd4", "#b2ebf2"],
      ["#9c27b0", "#e1bee7"],
    ];

    class Rocket {
      constructor(x, targetY, colorSet, scale) {
        this.x = x;
        this.y = h;
        this.targetY = targetY;
        this.colorSet = colorSet;
        this.scale = scale;
        this.speed = 14 * (scale + 0.1);
        this.length = 40 * scale;
        this.color = colorSet[0];
        this.exploded = false;
      }

      update() {
        this.y -= this.speed;
        if (this.y <= this.targetY) {
          this.exploded = true;
        }
      }

      draw() {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3 * this.scale;
        ctx.globalAlpha = 1;
        ctx.stroke();
        ctx.restore();
      }
    }

    class Burst {
      constructor(x, y, colorSet, radiusScale = 1) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = (150 + Math.random() * 30) * radiusScale;
        this.lines = 34;
        this.colors = colorSet;
        this.life = 1;
        this.speed = 1.8 * radiusScale;
      }

      update() {
        this.radius += this.speed;
        this.life -= 0.006;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        for (let i = 0; i < this.lines; i++) {
          const angle = (Math.PI * 2 * i) / this.lines;
          const end = this.radius;
          const start = end - 45;

          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * start, Math.sin(angle) * start);
          ctx.lineTo(Math.cos(angle) * end, Math.sin(angle) * end);
          ctx.strokeStyle = this.colors[i % this.colors.length];
          ctx.lineWidth = 2.3;
          ctx.globalAlpha = this.life;
          ctx.stroke();
        }

        ctx.restore();
      }

      alive() {
        return this.life > 0 && this.radius < this.maxRadius;
      }
    }

    function fireOne(index) {
      const gap = w / 4;

      const configs = [
        { x: gap, y: h / 2, scale: 1 },
        { x: w / 2, y: h / 4, scale: 0.7 },
        { x: w - gap, y: h / 2, scale: 1 },
        { x: w / 3, y: h / 3, scale: 0.6 },
        { x: w / 2, y: h / 2 - 40, scale: 1.2 },
        { x: (w / 3) * 2, y: h / 3, scale: 0.6 },
      ];

      rockets.push(
        new Rocket(
          configs[index].x,
          configs[index].y,
          palettes[index % palettes.length],
          configs[index].scale
        )
      );
    }

    let current = 0;
    let destroyed = false;

    function loopFireworks() {
      if (destroyed) {
        return;
      }

      fireOne(current);
      current = (current + 1) % 6;

      let nextDelay = 300 + Math.random() * 150;
      if (current === 0) nextDelay = 2500;

      timerRef.current = window.setTimeout(loopFireworks, nextDelay);
    }

    timerRef.current = window.setTimeout(loopFireworks, 500);

    function animate() {
      if (destroyed) {
        return;
      }

      ctx.clearRect(0, 0, w, h);

      for (let i = rockets.length - 1; i >= 0; i--) {
        rockets[i].update();
        rockets[i].draw();

        if (rockets[i].exploded) {
          bursts.push(
            new Burst(
              rockets[i].x,
              rockets[i].targetY,
              rockets[i].colorSet,
              rockets[i].scale
            )
          );
          rockets.splice(i, 1);
        }
      }

      for (let i = bursts.length - 1; i >= 0; i--) {
        bursts[i].update();
        bursts[i].draw();

        if (!bursts[i].alive()) {
          bursts.splice(i, 1);
        }
      }

      animationFrameRef.current = window.requestAnimationFrame(animate);
    }

    animate();

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resize);

    return () => {
      destroyed = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      window.removeEventListener("resize", resize);
    };
  }, [isActive]);

  if (!isActive) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        background: "transparent",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}
