import React, { useEffect, useRef, useCallback } from 'react';
import './Home.css';

// -----------------------------------------------------------------------------
// EXACT CONSTANTS & PARAMETERS MATCHING IMAGE 1 & CENTER LOBE DETAIL
// -----------------------------------------------------------------------------
const TOTAL_PARTICLES = 5200; // Rich, dense particle count
const BUTTERFLY_SIZE = 100;
const GROW_FRAMES = 75; // ~2.8 seconds blossoming enlargement from center
const FRAME_INTERVAL_MS = 36; // ~28 FPS smooth playback

/**
 * Convert HSV to Hex color code
 */
function hsvToHex(h, s, v) {
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  const toHex = (n) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate 5200 fine pixel particles using Temple H. Fay's Butterfly Curve (1989):
 * Matches the intricate center lobes (horizontal petals + vertical body + 4 wings):
 * - Core & Inner Rays: Electric Cyan & Sky Azure (Hue 0.50 - 0.56)
 * - Mid-Wings: Royal Sapphire Blue & Electric Violet (Hue 0.57 - 0.70)
 * - Outer Margins & Tips: Vibrant Magenta & Hot Rose-Pink (Hue 0.72 - 0.88)
 */
function createButterflyParticles() {
  const particles = [];

  for (let i = 0; i < TOTAL_PARTICLES; i++) {
    // 1. Angle around butterfly curve [0, 12 * PI]
    const angle = Math.random() * 12 * Math.PI;

    // 2. Mathematical butterfly curve (Temple H. Fay, 1989)
    const radius =
      Math.exp(Math.cos(angle)) -
      2 * Math.cos(4 * angle) +
      Math.pow(Math.sin(angle / 12), 5);

    // 3. Boundary coordinates
    const bx = radius * Math.sin(angle);
    const by = radius * Math.cos(angle);

    // 4. Spread particles inside all 6 lobes (0.08 to 1.0)
    // Non-linear distribution ensures rich particle density right into the center
    const spread = Math.pow(Math.random(), 0.85) * (1.0 - 0.08) + 0.08;

    const x = bx * BUTTERFLY_SIZE * spread + (Math.random() - 0.5) * 2.8;
    const y = by * BUTTERFLY_SIZE * spread + (Math.random() - 0.5) * 2.8;

    // 5. Normalized radial distance from core to wingtips: t in [0, 1]
    const t = Math.min(1.0, Math.max(0.0, (spread - 0.08) / (1.0 - 0.08)));

    // Harmonic Hue gradient: Core Cyan (0.52) -> Mid Violet (0.68) -> Tips Magenta/Pink (0.86)
    const hue = Math.max(
      0.50,
      Math.min(0.88, 0.52 + 0.35 * Math.pow(t, 1.15) + (Math.random() - 0.5) * 0.04)
    );
    const color = hsvToHex(hue, 0.92, 1.0);

    // 6. Particle orientation along radial ray from center (dx, dy)
    const radAngle = Math.atan2(y, x);
    const dashLen = t > 0.22 ? 1.3 + Math.random() * 1.8 : 1.0;
    const size = Math.random() < 0.72 ? 1.2 : 1.8;

    particles.push({
      x,
      y,
      color,
      radAngle,
      dashLen,
      size,
    });
  }

  return particles;
}

const Home = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Animation references
  const particlesRef = useRef([]);
  const frameRef = useRef(0);
  const animIdRef = useRef(null);
  const lastTimeRef = useRef(0);
  const dimensionsRef = useRef({ width: 900, height: 750, dpr: 1 });

  // Reset and restart blossoming enlargement from center
  const restartAnimation = useCallback(() => {
    frameRef.current = 0;
    lastTimeRef.current = 0;
    particlesRef.current = createButterflyParticles();
  }, []);

  // Initialize particles & reset frame on mount (so refresh always triggers enlargement)
  useEffect(() => {
    restartAnimation();
  }, [restartAnimation]);

  // Handle window resize with Retina / High-DPI sharpness
  const updateDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = Math.max(300, rect.width);
    const height = Math.max(300, rect.height);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    dimensionsRef.current = { width, height, dpr };
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  // Keyboard shortcut (Space / R) to replay enlargement from center
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === 'r' || e.key === 'R') {
        restartAnimation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [restartAnimation]);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = (currentTime) => {
      if (!isRunning) return;

      // Throttle strictly to target frame rate (~28 FPS)
      const elapsed = currentTime - lastTimeRef.current;
      if (elapsed < FRAME_INTERVAL_MS) {
        animIdRef.current = requestAnimationFrame(render);
        return;
      }
      lastTimeRef.current = currentTime - (elapsed % FRAME_INTERVAL_MS);

      const { width, height, dpr } = dimensionsRef.current;
      const frame = frameRef.current;

      // Optical centering: adjust visual center slightly (+20px) to balance top & bottom wings
      const centerX = width / 2;
      const centerY = height / 2 + 18;

      // ENLARGED SCALE: Scales the butterfly up to 96% of the screen so it is big, grand, and prominent
      const scaleFit = Math.min((width * 0.96) / 640, (height * 0.96) / 570, 1.8);

      // Save context state for high-DPI transform
      ctx.save();
      ctx.scale(dpr, dpr);

      // Deep space cosmic black background (#02010b) from butterfly.py
      ctx.fillStyle = '#02010b';
      ctx.fillRect(0, 0, width, height);

      // Subtle atmospheric background nebula aura
      const bgGlow = ctx.createRadialGradient(
        centerX,
        centerY - 20,
        15,
        centerX,
        centerY - 20,
        Math.max(width, height) * 0.55
      );
      bgGlow.addColorStop(0, 'rgba(20, 10, 48, 0.45)');
      bgGlow.addColorStop(0.5, 'rgba(6, 3, 24, 0.22)');
      bgGlow.addColorStop(1, 'rgba(2, 1, 11, 0)');
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      // -----------------------------------------------------------------
      // ENLARGE FROM CENTER LIFECYCLE (Smoothstep Blossoming Expansion)
      // -----------------------------------------------------------------
      let scale;
      if (frame < GROW_FRAMES) {
        // Starts tightly at center (scale 0.02) and smoothly ENLARGES outward to 1.0
        let progress = frame / GROW_FRAMES;
        // Cubic smoothstep easing: smooth start and gentle deceleration at peak
        progress = progress * progress * (3 - 2 * progress);
        scale = 0.02 + 0.98 * progress;
      } else {
        // Mature phase: full size (1.0) with subtle organic breathing oscillation
        const breath = 1.0 + 0.012 * Math.sin((frame - GROW_FRAMES) * 0.035);
        scale = 1.0 * breath;
      }

      // -----------------------------------------------------------------
      // DRAW 5,200 FINE PIXEL PARTICLES (CLEAR INTRICATE CENTER)
      // -----------------------------------------------------------------
      const particles = particlesRef.current;
      const total = particles.length;

      for (let i = 0; i < total; i++) {
        const p = particles[i];

        // Micro-jitter shimmer after reaching full size ([-0.35, 0.35] px)
        let move_x = 0;
        let move_y = 0;
        if (frame >= GROW_FRAMES) {
          move_x = (Math.random() - 0.5) * 0.7;
          move_y = (Math.random() - 0.5) * 0.7;
        }

        // Coordinate transformation:
        // Python Turtle center is (0, 0) with +Y going UP.
        // Canvas center is (centerX, centerY) with +Y going DOWN.
        const draw_x = centerX + (p.x * scale + move_x) * scaleFit;
        const draw_y = centerY - (p.y * scale + move_y) * scaleFit;

        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;

        // Render fine pixel particles / directional radial micro-dashes
        if (p.dashLen > 1.2 && frame >= GROW_FRAMES * 0.25) {
          // Fine radial streak radiating outward along the wing
          const dx = Math.cos(p.radAngle) * p.dashLen * scaleFit;
          const dy = -Math.sin(p.radAngle) * p.dashLen * scaleFit;

          ctx.lineWidth = Math.max(1.0, p.size * 0.8 * scaleFit);
          ctx.beginPath();
          ctx.moveTo(draw_x, draw_y);
          ctx.lineTo(draw_x + dx, draw_y + dy);
          ctx.stroke();
        } else {
          // Sharp solid pixel dot (1-2px)
          const pxSize = Math.max(1.0, Math.round(p.size * scaleFit));
          ctx.fillRect(
            Math.round(draw_x - pxSize / 2),
            Math.round(draw_y - pxSize / 2),
            pxSize,
            pxSize
          );
        }
      }

      // -----------------------------------------------------------------
      // DELICATE CENTER NUCLEUS (Preserves central horizontal & vertical lobes)
      // -----------------------------------------------------------------
      const coreX = centerX;
      const coreY = centerY;

      // Soft ambient radiant aura around the origin
      const auraRadius = 14 * scaleFit * (scale > 0.5 ? 1 : scale * 2);
      const auraGrad = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, auraRadius);
      auraGrad.addColorStop(0, 'rgba(0, 245, 255, 0.4)');
      auraGrad.addColorStop(0.5, 'rgba(20, 60, 255, 0.2)');
      auraGrad.addColorStop(1, 'rgba(2, 1, 11, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(coreX, coreY, auraRadius, 0, Math.PI * 2);
      ctx.fill();

      // Sharp 1.5px luminous core spark
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(coreX, coreY, Math.max(1.0, 1.6 * scaleFit), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      frameRef.current += 1;
      animIdRef.current = requestAnimationFrame(render);
    };

    animIdRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
      }
    };
  }, []);

  return (
    <div
      className="butterfly-page"
      ref={containerRef}
      onClick={restartAnimation}
      title="Click anywhere to replay blossoming enlargement from center"
    >
      <canvas ref={canvasRef} className="butterfly-canvas" />
    </div>
  );
};

export default Home;
