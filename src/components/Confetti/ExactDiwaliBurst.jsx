import React, { useEffect, useRef } from "react";

export default function ExactDiwaliBurst({
  isActive = true,
  backgroundOpacity = 0.1,
  zIndex = 9998,
}) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerRef = useRef(null);
  const isActiveRef = useRef(isActive);
  const targetOpacityRef = useRef(backgroundOpacity);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    targetOpacityRef.current = backgroundOpacity;
  }, [backgroundOpacity]);

  useEffect(() => {
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
    let overlayAlpha = isActiveRef.current ? targetOpacityRef.current : 0;

    const bursts = [];
    const rockets = [];

    const palettes = [
      ["#fff6a3", "#ffd700", "#ffb300", "#fffde7"],
      ["#d6fff8", "#00e5ff", "#00b8d4", "#e0f7fa"],
      ["#ffd6ec", "#ff4fa3", "#ff1f7a", "#ffe3f1"],
      ["#e6dcff", "#9c4dff", "#7c3aed", "#f2ebff"],
      ["#ddffd6", "#39ff88", "#00c853", "#f1ffe9"],
      ["#ffe0b2", "#ff9100", "#ff6d00", "#fff3e0"],
    ];

    class Rocket {
      constructor(x, targetY, colorSet, scale) {
        this.x = x;
        this.y = h;
        this.prevY = h;
        this.targetY = targetY;
        this.colorSet = colorSet;
        this.scale = scale;
        this.speed = 14 * (scale + 0.1);
        this.length = 40 * scale;
        this.color = colorSet[0];
        this.exploded = false;
        this.trail = [];
      }

      update() {
        this.prevY = this.y;
        this.y -= this.speed;
        this.trail.push(this.prevY);
        if (this.trail.length > 12) {
          this.trail.shift();
        }
        if (this.y <= this.targetY) {
          this.exploded = true;
        }
      }

      draw() {
        ctx.save();

        // Rope-like tail from bottom to rocket head (launch path).
        const ropeEndY = Math.min(h, this.y + this.length * 0.35);
        const ropeGradient = ctx.createLinearGradient(this.x, h, this.x, ropeEndY);
        ropeGradient.addColorStop(0, "rgba(255,255,255,0.08)");
        ropeGradient.addColorStop(0.35, this.color);
        ropeGradient.addColorStop(1, "rgba(255,255,255,0.95)");
        ctx.beginPath();
        ctx.moveTo(this.x, h);
        ctx.lineTo(this.x, ropeEndY);
        ctx.strokeStyle = ropeGradient;
        ctx.lineWidth = 2.8 * this.scale;
        ctx.globalAlpha = 0.72;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.stroke();

        // Tapered glowing tail
        for (let i = 0; i < this.trail.length; i++) {
          const y = this.trail[i];
          const alpha = ((i + 1) / this.trail.length) * 0.45;
          ctx.beginPath();
          ctx.moveTo(this.x, y);
          ctx.lineTo(this.x, y + this.length * 0.8);
          ctx.strokeStyle = this.color;
          ctx.lineWidth = (1.2 + (i / this.trail.length) * 2.2) * this.scale;
          ctx.globalAlpha = alpha;
          ctx.shadowColor = this.color;
          ctx.shadowBlur = 8;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3 * this.scale;
        ctx.globalAlpha = 1;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();
      }
    }

    class Burst {
      constructor(x, y, colorSet, radiusScale = 1) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = (190 + Math.random() * 35) * radiusScale;
        this.lines = 34;
        this.colors = colorSet;
        this.life = 1;
        this.speed = 1.55 * radiusScale;
      }

      update() {
        this.radius += this.speed;
        this.life -= 0.0045;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        for (let i = 0; i < this.lines; i++) {
          const angle = (Math.PI * 2 * i) / this.lines;
          const isBigWave = i % 2 === 0;
          const waveRadiusScale = isBigWave ? 1.2 : 0.78;
          const waveLength = isBigWave ? 56 : 30;
          const end = this.radius * waveRadiusScale;
          const start = end - waveLength;
          const startX = Math.cos(angle) * start;
          const startY = Math.sin(angle) * start;
          const endX = Math.cos(angle) * end;
          const endY = Math.sin(angle) * end;
          const glitterGradient = ctx.createLinearGradient(startX, startY, endX, endY);
          glitterGradient.addColorStop(0, this.colors[0]);
          glitterGradient.addColorStop(0.4, this.colors[1]);
          glitterGradient.addColorStop(0.75, this.colors[2]);
          glitterGradient.addColorStop(1, this.colors[3]);

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = glitterGradient;
          ctx.lineWidth = isBigWave ? 2.8 : 2.1;
          ctx.shadowColor = this.colors[i % this.colors.length];
          ctx.shadowBlur = 12;
          ctx.globalAlpha = this.life * (0.85 + Math.random() * 0.25);
          ctx.stroke();

          // Tiny glitter spark at the tip for a shiny burst finish.
          ctx.beginPath();
          ctx.fillStyle = this.colors[(i + 1) % this.colors.length];
          ctx.arc(endX, endY, 1.2 + Math.random() * 1.8, 0, Math.PI * 2);
          ctx.globalAlpha = this.life * 0.9;
          ctx.fill();
        }

        ctx.restore();
      }

      alive() {
        return this.radius < this.maxRadius || this.life > 0.08;
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

      let nextDelay = 180;
      if (isActiveRef.current) {
        fireOne(current);
        current = (current + 1) % 6;
        nextDelay = 300 + Math.random() * 150;
        if (current === 0) nextDelay = 2500;
      }

      timerRef.current = window.setTimeout(loopFireworks, nextDelay);
    }

    timerRef.current = window.setTimeout(loopFireworks, 500);

    function animate() {
      if (destroyed) {
        return;
      }

      ctx.clearRect(0, 0, w, h);

      const targetOverlay = isActiveRef.current ? targetOpacityRef.current : 0;
      overlayAlpha += (targetOverlay - overlayAlpha) * 0.08;
      if (overlayAlpha > 0.002) {
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha})`;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

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
  }, []);

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
        zIndex,
      }}
    />
  );
}
