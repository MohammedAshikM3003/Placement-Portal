import React, { useEffect, useRef } from 'react';
import styles from './Confetti.module.css';

const COLORS = ['#4F46E5', '#2568C5', '#2085f6', '#4EA24E', '#D23B42'];
const CONFETTI_COUNT = 180;

class PaperFlake {
  constructor(container, delay = 0) {
    this.container = container;

    // Create DOM element with inner paper for 3D flutter effect
    this.el = document.createElement('div');
    this.el.className = styles.paperFlake;

    this.inner = document.createElement('div');
    this.inner.className = styles.innerPaper;

    // Random size - base size 3-8px with varied aspect ratio
    const baseSize = Math.random() * 5 + 3;
    this.width = baseSize;
    this.height = baseSize * (Math.random() * 0.6 + 1.2);

    // Position
    this.x = Math.random() * window.innerWidth;
    this.y = -100;

    // Physics properties - larger papers fall slightly faster
    this.baseSpeed = (Math.random() * 30 + 40) * (baseSize / 5);
    this.angle = Math.random() * Math.PI * 2;
    this.oscFreq = Math.random() * 1.5 + 0.5;
    this.oscAmp = Math.random() * 12 + 4;

    // Visual
    this.rotationZ = Math.random() * 360;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.flutterSpeed = (Math.random() * 0.8 + 1.0).toFixed(2);

    // Mouse interaction
    this.offsetX = 0;
    this.offsetY = 0;
    this.targetOffsetX = 0;
    this.targetOffsetY = 0;

    // Apply styles
    this.el.style.width = `${this.width}px`;
    this.el.style.height = `${this.height}px`;
    this.el.style.opacity = '0';

    // Set CSS variables for color and flutter speed
    this.inner.style.setProperty('--bg', this.color);
    this.inner.style.setProperty('--f-speed', `${this.flutterSpeed}s`);
    this.inner.style.transform = `rotateZ(${this.rotationZ}deg)`;

    this.el.appendChild(this.inner);

    // Delayed spawn for staggered effect
    setTimeout(() => {
      if (this.container) {
        this.container.appendChild(this.el);
        this.el.style.opacity = '1';
      }
    }, delay);
  }

  update(dt, mouseX, mouseY) {
    if (!this.el.parentNode) return;

    // 1. Vertical movement
    this.y += this.baseSpeed * dt;

    // 2. Horizontal swaying (organic movement)
    this.angle += dt * this.oscFreq;
    const currentBaseX = this.x + Math.sin(this.angle) * this.oscAmp;

    // 3. Mouse repulsion
    const dx = (currentBaseX + this.offsetX) - mouseX;
    const dy = (this.y + this.offsetY) - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const threshold = 110;

    if (dist < threshold) {
      const force = (threshold - dist) / threshold;
      this.targetOffsetX = (dx / dist) * 90 * force;
      this.targetOffsetY = (dy / dist) * 35 * force;
    } else {
      this.targetOffsetX = 0;
      this.targetOffsetY = 0;
    }

    // 4. Smooth interpolation (lerp)
    const lerpPower = 1 - Math.pow(0.01, dt);
    this.offsetX += (this.targetOffsetX - this.offsetX) * lerpPower;
    this.offsetY += (this.targetOffsetY - this.offsetY) * lerpPower;

    // 5. GPU-accelerated transform
    this.el.style.transform = `translate3d(${(currentBaseX + this.offsetX).toFixed(2)}px, ${(this.y + this.offsetY).toFixed(2)}px, 0)`;

    // 6. Recycle if off screen
    if (this.y > window.innerHeight + 100) {
      this.y = -100;
      this.x = Math.random() * window.innerWidth;
      this.targetOffsetX = 0;
      this.targetOffsetY = 0;
      this.offsetX = 0;
      this.offsetY = 0;
    }
  }

  destroy() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
  }
}

const Confetti = ({ isActive }) => {
  const containerRef = useRef(null);
  const flakesRef = useRef([]);
  const mouseRef = useRef({ x: -2000, y: -2000 });
  const lastTimeRef = useRef(performance.now());
  const animationRef = useRef(null);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      flakesRef.current.forEach(flake => {
        flake.y = -100;
        flake.x = Math.random() * window.innerWidth;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize confetti
  useEffect(() => {
    if (!isActive || !containerRef.current) {
      // Cleanup
      flakesRef.current.forEach(flake => flake.destroy());
      flakesRef.current = [];
      return;
    }

    // Create papers with staggered delays (22ms between each)
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const flake = new PaperFlake(containerRef.current, i * 22);
      flakesRef.current.push(flake);
    }

    // Animation loop with delta-time physics
    const animate = (currentTime) => {
      const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = currentTime;

      flakesRef.current.forEach(flake => {
        flake.update(dt, mouseRef.current.x, mouseRef.current.y);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      flakesRef.current.forEach(flake => flake.destroy());
      flakesRef.current = [];
    };
  }, [isActive]);

  if (!isActive) return null;

  return <div className={styles.confettiContainer} ref={containerRef} />;
};

export default Confetti;
