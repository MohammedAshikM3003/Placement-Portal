import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import styles from './SignupInteractiveBackground.module.css';

const PARTICLE_COUNT = 60;
const CONNECTION_DISTANCE = 100;
const MOUSE_RADIUS = 50;

// Role-based color themes
const ROLE_COLORS = {
  student: ['#60a5fa', '#93c5fd', '#3b82f6', '#bfdbfe', '#2563eb'],     // Blue
  coordinator: ['#f87171', '#fca5a5', '#ef4444', '#fecaca', '#dc2626'],  // Red
  admin: ['#4ade80', '#86efac', '#22c55e', '#bbf7d0', '#16a34a'],        // Green
};

class Particle {
  constructor(canvas, colors) {
    this.canvas = canvas;
    this.colors = colors;
    this.reset();
  }

  reset() {
    this.x = Math.random() * this.canvas.width;
    this.y = Math.random() * this.canvas.height;
    this.size = Math.random() * 3 + 2;
    this.baseSize = this.size;
    this.speedX = (Math.random() - 0.5) * 1;
    this.speedY = (Math.random() - 0.5) * 1;
    this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    this.opacity = Math.random() * 0.4 + 0.5;
    this.baseOpacity = this.opacity;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.pulseSpeed = Math.random() * 0.02 + 0.01;
  }

  update(mouse) {
    this.pulsePhase += this.pulseSpeed;
    const pulse = Math.sin(this.pulsePhase) * 0.3;
    this.size = this.baseSize + pulse;
    this.opacity = this.baseOpacity + pulse * 0.15;

    if (mouse.x !== null && mouse.y !== null) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MOUSE_RADIUS) {
        const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
        const angle = Math.atan2(dy, dx);
        this.speedX += Math.cos(angle + Math.PI / 2) * force * 0.4 + Math.cos(angle) * force * 0.08;
        this.speedY += Math.sin(angle + Math.PI / 2) * force * 0.4 + Math.sin(angle) * force * 0.08;
        this.size = this.baseSize + force * 3;
        this.opacity = Math.min(1, this.baseOpacity + force * 0.4);
      }
    }

    this.speedX *= 0.98;
    this.speedY *= 0.98;
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x < 0) this.x = this.canvas.width;
    if (this.x > this.canvas.width) this.x = 0;
    if (this.y < 0) this.y = this.canvas.height;
    if (this.y > this.canvas.height) this.y = 0;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.opacity;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2.5);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.globalAlpha = this.opacity * 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// Icons: Student (blue), Coordinator (red), Admin (green)
const STUDENT_ICONS = [
  // Graduation cap
  (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 1.3, y);
    ctx.lineTo(x, y + size * 0.3);
    ctx.lineTo(x - size * 1.3, y);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + size * 1.3, y);
    ctx.lineTo(x + size * 1.3, y + size * 0.6);
    ctx.stroke();
  },
  // Book
  (ctx, x, y, size) => {
    ctx.strokeRect(x - size * 0.8, y - size, size * 1.6, size * 2);
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - size * 0.5, y - size * 0.5);
    ctx.lineTo(x - size * 0.15, y - size * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - size * 0.5, y);
    ctx.lineTo(x - size * 0.15, y);
    ctx.stroke();
  },
  // Resume/document
  (ctx, x, y, size) => {
    ctx.strokeRect(x - size * 0.7, y - size, size * 1.4, size * 2);
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y - size * 0.5);
    ctx.lineTo(x + size * 0.4, y - size * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y - size * 0.1);
    ctx.lineTo(x + size * 0.4, y - size * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y + size * 0.3);
    ctx.lineTo(x + size * 0.2, y + size * 0.3);
    ctx.stroke();
  },
];

const COORDINATOR_ICONS = [
  // Clipboard
  (ctx, x, y, size) => {
    ctx.strokeRect(x - size * 0.7, y - size * 0.7, size * 1.4, size * 1.8);
    ctx.strokeRect(x - size * 0.25, y - size * 1, size * 0.5, size * 0.4);
    ctx.beginPath();
    ctx.moveTo(x - size * 0.35, y - size * 0.1);
    ctx.lineTo(x + size * 0.35, y - size * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - size * 0.35, y + size * 0.3);
    ctx.lineTo(x + size * 0.35, y + size * 0.3);
    ctx.stroke();
  },
  // Megaphone
  (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.moveTo(x - size * 0.8, y - size * 0.3);
    ctx.lineTo(x + size * 0.5, y - size);
    ctx.lineTo(x + size * 0.5, y + size);
    ctx.lineTo(x - size * 0.8, y + size * 0.3);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + size * 0.5, y);
    ctx.lineTo(x + size, y);
    ctx.stroke();
  },
  // Calendar
  (ctx, x, y, size) => {
    ctx.strokeRect(x - size, y - size * 0.7, size * 2, size * 1.7);
    ctx.beginPath();
    ctx.moveTo(x - size, y - size * 0.2);
    ctx.lineTo(x + size, y - size * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y - size * 1);
    ctx.lineTo(x - size * 0.4, y - size * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + size * 0.4, y - size * 1);
    ctx.lineTo(x + size * 0.4, y - size * 0.7);
    ctx.stroke();
  },
];

const ADMIN_ICONS = [
  // Shield
  (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.moveTo(x, y - size * 1.1);
    ctx.lineTo(x + size, y - size * 0.5);
    ctx.lineTo(x + size * 0.8, y + size * 0.5);
    ctx.lineTo(x, y + size * 1.1);
    ctx.lineTo(x - size * 0.8, y + size * 0.5);
    ctx.lineTo(x - size, y - size * 0.5);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.3);
    ctx.lineTo(x, y + size * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - size * 0.3, y + size * 0.1);
    ctx.lineTo(x + size * 0.3, y + size * 0.1);
    ctx.stroke();
  },
  // Gear/Settings
  (ctx, x, y, size) => {
    const r = size * 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      ctx.lineTo(x + Math.cos(a) * size, y + Math.sin(a) * size);
      ctx.stroke();
    }
  },
  // Dashboard/chart
  (ctx, x, y, size) => {
    ctx.strokeRect(x - size, y - size * 0.8, size * 2, size * 1.6);
    ctx.beginPath();
    ctx.moveTo(x - size * 0.6, y + size * 0.5);
    ctx.lineTo(x - size * 0.6, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - size * 0.1, y + size * 0.5);
    ctx.lineTo(x - size * 0.1, y - size * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + size * 0.4, y + size * 0.5);
    ctx.lineTo(x + size * 0.4, y + size * 0.15);
    ctx.stroke();
  },
];

// Common icons shared across roles
const COMMON_ICONS = [
  // Star
  (ctx, x, y, size) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = x + Math.cos(angle) * size;
      const py = y + Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  },
  // Rocket
  (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.moveTo(x, y - size * 1.2);
    ctx.quadraticCurveTo(x + size * 0.7, y - size * 0.3, x + size * 0.5, y + size * 0.5);
    ctx.lineTo(x - size * 0.5, y + size * 0.5);
    ctx.quadraticCurveTo(x - size * 0.7, y - size * 0.3, x, y - size * 1.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - size * 0.3, y + size * 0.5);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x + size * 0.3, y + size * 0.5);
    ctx.stroke();
  },
  // Trophy
  (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.moveTo(x - size * 0.6, y - size);
    ctx.lineTo(x + size * 0.6, y - size);
    ctx.lineTo(x + size * 0.4, y + size * 0.2);
    ctx.lineTo(x - size * 0.4, y + size * 0.2);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.2);
    ctx.lineTo(x, y + size * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y + size * 0.7);
    ctx.lineTo(x + size * 0.4, y + size * 0.7);
    ctx.stroke();
  },
];

class FloatingIcon {
  constructor(canvas, roleIcons, roleColor) {
    this.canvas = canvas;
    this.roleColor = roleColor;
    const allIcons = [...roleIcons, ...COMMON_ICONS];
    this.iconFn = allIcons[Math.floor(Math.random() * allIcons.length)];
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 8 + 14;
    this.speedX = (Math.random() - 0.5) * 0.35;
    this.speedY = (Math.random() - 0.5) * 0.35;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.012;
    this.opacity = Math.random() * 0.2 + 0.3;
    this.baseOpacity = this.opacity;
    this.floatPhase = Math.random() * Math.PI * 2;
  }

  update(mouse) {
    this.floatPhase += 0.008;
    this.y += Math.sin(this.floatPhase) * 0.3;
    this.rotation += this.rotSpeed;

    if (mouse.x !== null && mouse.y !== null) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS * 2) {
        const force = (MOUSE_RADIUS * 2 - dist) / (MOUSE_RADIUS * 2);
        this.opacity = Math.min(0.9, this.baseOpacity + force * 0.55);
        this.rotSpeed += force * 0.003;
        const angle = Math.atan2(dy, dx);
        this.x -= Math.cos(angle) * force * 1.5;
        this.y -= Math.sin(angle) * force * 1.5;
      } else {
        this.opacity += (this.baseOpacity - this.opacity) * 0.05;
      }
    }

    this.x += this.speedX;
    this.y += this.speedY;
    this.rotSpeed *= 0.995;

    if (this.x < -30) this.x = this.canvas.width + 30;
    if (this.x > this.canvas.width + 30) this.x = -30;
    if (this.y < -30) this.y = this.canvas.height + 30;
    if (this.y > this.canvas.height + 30) this.y = -30;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.strokeStyle = this.roleColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = this.opacity;
    this.iconFn(ctx, 0, 0, this.size);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

const SignupInteractiveBackground = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: null, y: null });
  const particlesRef = useRef([]);
  const iconsRef = useRef([]);
  const animFrameRef = useRef(null);
  const timeRef = useRef(0);
  const [ripples, setRipples] = useState([]);
  const rippleIdRef = useRef(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const testimonials = useMemo(() => [
    { name: 'Your Success Story', company: 'Dream Company', batch: 'Awaits', branch: '', text: 'Be the next to achieve your dream placement! Join thousands of students who have successfully landed their career opportunities through our platform.' },
  ], []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIdx((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: null, y: null };
  }, []);

  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    particlesRef.current.forEach((p) => {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS * 2) {
        const force = (MOUSE_RADIUS * 2 - dist) / (MOUSE_RADIUS * 2);
        const angle = Math.atan2(dy, dx);
        p.speedX += Math.cos(angle) * force * 6;
        p.speedY += Math.sin(angle) * force * 6;
        p.opacity = 1;
        p.size = p.baseSize + force * 5;
      }
    });

    const id = rippleIdRef.current++;
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 800);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles split across 3 roles
    const roles = ['student', 'coordinator', 'admin'];
    const perRole = Math.floor(PARTICLE_COUNT / 3);
    const particles = [];
    roles.forEach((role) => {
      for (let i = 0; i < perRole; i++) {
        particles.push(new Particle(canvas, ROLE_COLORS[role]));
      }
    });
    particlesRef.current = particles;

    // Create icons split across 3 roles
    const roleIconSets = [
      { icons: STUDENT_ICONS, color: '#60a5fa' },
      { icons: COORDINATOR_ICONS, color: '#f87171' },
      { icons: ADMIN_ICONS, color: '#4ade80' },
    ];
    const iconList = [];
    roleIconSets.forEach(({ icons, color }) => {
      for (let i = 0; i < 4; i++) {
        iconList.push(new FloatingIcon(canvas, icons, color));
      }
    });
    iconsRef.current = iconList;

    const animate = () => {
      timeRef.current += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mouse = mouseRef.current;

      // Draw floating icons
      iconsRef.current.forEach((icon) => {
        icon.update(mouse);
        icon.draw(ctx);
      });

      // Update particles
      particlesRef.current.forEach((p) => p.update(mouse));

      // Draw connections (color based on particle colors)
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const a = particlesRef.current[i];
          const b = particlesRef.current[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.3;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(200, 200, 255, ${opacity})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      // Cursor glow - fixed purple
      if (mouse.x !== null && mouse.y !== null) {
        const glowGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, MOUSE_RADIUS);
        glowGrad.addColorStop(0, 'rgba(139, 92, 246, 0.2)');
        glowGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.08)');
        glowGrad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, MOUSE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        particlesRef.current.forEach((p) => {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS) {
            const opacity = (1 - dist / MOUSE_RADIUS) * 0.4;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = `rgba(167, 139, 250, ${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        });
      }

      // Draw particles
      particlesRef.current.forEach((p) => p.draw(ctx));

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div
      className={styles.container}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} className={styles.canvas} />

      {/* Welcome text overlay */}
      <div className={styles.welcomeOverlay}>
        <div className={styles.welcomeLine1}>Welcome to</div>
        <div className={styles.welcomeLine1}>K.S.R College of Engineering</div>
        <div className={styles.welcomeTitle}>Placement Portal</div>
        <div className={styles.welcomeDesc}>
          Your gateway to career opportunities
        </div>
        <div className={styles.welcomeFooter}>
          Connect with top recruiters, track placement drives, and build your career — all in one place. Empowering students to land their dream jobs.
        </div>

        {/* Testimonial card */}
        <div className={styles.testimonialCard} key={testimonialIdx}>
          <div className={styles.testimonialCardInner}>
            <div className={styles.testimonialContent}>
              <p className={styles.testimonialText}>
                "{testimonials[testimonialIdx].text}"
              </p>
            </div>
            <div className={styles.testimonialProfile}>
              <div className={styles.testimonialAvatar}>
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="32" viewBox="0 0 640 512">
                  <path fill="currentColor" d="M320 32c-8.1 0-16.1 1.4-23.7 4.1L15.8 137.4C6.3 140.9 0 149.9 0 160s6.3 19.1 15.8 22.6l57.9 20.9C57.3 229.3 48 259.8 48 291.9V320c0 28.4-10.8 57.7-22.3 80.8c-6.5 13-13.9 25.8-22.5 37.6c-3.2 4.3-4.1 9.9-2.3 15s6 8.9 11.2 10.2l64 16c4.2 1.1 8.7.3 12.4-2s6.3-6.1 7.1-10.4c8.6-42.8 4.3-81.2-2.1-108.7c-3.2-14.2-7.5-28.7-13.5-42v-24.6c0-30.2 10.2-58.7 27.9-81.5c12.9-15.5 29.6-28 49.2-35.7l157-61.7c8.2-3.2 17.5.8 20.7 9s-.8 17.5-9 20.7l-157 61.7c-12.4 4.9-23.3 12.4-32.2 21.6l159.6 57.6c7.6 2.7 15.6 4.1 23.7 4.1s16.1-1.4 23.7-4.1l280.6-101c9.5-3.4 15.8-12.5 15.8-22.6s-6.3-19.1-15.8-22.6L343.7 36.1c-7.6-2.7-15.6-4.1-23.7-4.1M128 408c0 35.3 86 72 192 72s192-36.7 192-72l-15.3-145.4L354.5 314c-11.1 4-22.8 6-34.5 6s-23.5-2-34.5-6l-142.2-51.4z"/>
                </svg>
              </div>
              <span className={styles.testimonialName}>
                {testimonials[testimonialIdx].name}
              </span>
              <span className={styles.testimonialDetails}>
                {testimonials[testimonialIdx].branch}
              </span>
              <span className={styles.testimonialDetails}>
                Batch {testimonials[testimonialIdx].batch}
              </span>
              <span className={styles.testimonialRole}>
                {testimonials[testimonialIdx].company}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Click ripples */}
      {ripples.map((r) => (
        <div
          key={r.id}
          className={styles.ripple}
          style={{ left: r.x, top: r.y }}
        />
      ))}
    </div>
  );
};

export default SignupInteractiveBackground;
