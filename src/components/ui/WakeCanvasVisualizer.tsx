import React, { useEffect, useRef } from 'react';

interface WakeCanvasVisualizerProps {
  triggerKey: number; // Timestamp of when wake word is triggered
  isHubOpen: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isPowerSaving: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  decay: number;
  angle: number;
  speed: number;
}

interface Shockwave {
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  width: number;
  speed: number;
}

// Particle colors centered around Aether's palette (Neon Amber, Teal, Gold, Emerald)
const PARTICLE_COLORS = [
  'rgba(245, 158, 11, 0.8)',   // Amber
  'rgba(16, 185, 129, 0.8)',  // Emerald
  'rgba(20, 184, 166, 0.8)',  // Teal
  'rgba(234, 179, 8, 0.8)',   // Yellow/Gold
];

export const WakeCanvasVisualizer: React.FC<WakeCanvasVisualizerProps> = ({
  triggerKey,
  isHubOpen,
  isListening,
  isSpeaking,
  isPowerSaving,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const prevTriggerKeyRef = useRef<number>(0);
  const burstIntensityRef = useRef<number>(0); // 1.0 down to 0.0

  // Spawn visualizer burst on triggerKey change
  useEffect(() => {
    if (triggerKey > 0 && triggerKey !== prevTriggerKeyRef.current) {
      prevTriggerKeyRef.current = triggerKey;
      burstIntensityRef.current = 1.0;

      const particles: Particle[] = [];
      const shockwaves: Shockwave[] = [];

      // 1. Spawn a high-energy particle burst!
      const particleCount = 45;
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.5 + Math.random() * 4.5;
        particles.push({
          x: 64, // Center of 128x128 container
          y: 64,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
          alpha: 0.9 + Math.random() * 0.1,
          size: 1.5 + Math.random() * 3.0,
          decay: 0.015 + Math.random() * 0.02,
          angle,
          speed,
        });
      }

      // 2. Spawn multiple expanding shockwave rings!
      shockwaves.push({
        radius: 20,
        maxRadius: 62,
        alpha: 0.95,
        color: 'rgba(16, 185, 129, 0.7)', // emerald
        width: 3.5,
        speed: 2.2,
      });

      shockwaves.push({
        radius: 12,
        maxRadius: 52,
        alpha: 0.8,
        color: 'rgba(245, 158, 11, 0.6)', // amber
        width: 2.0,
        speed: 1.6,
      });

      particlesRef.current = [...particlesRef.current, ...particles].slice(-100); // Caps particle pool
      shockwavesRef.current = [...shockwavesRef.current, ...shockwaves];
    }
  }, [triggerKey]);

  useEffect(() => {
    if (isPowerSaving) {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 128, 128);
        }
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina display resolution support safely
    const dpr = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
    try {
      canvas.width = 128 * dpr;
      canvas.height = 128 * dpr;
      if (typeof ctx.scale === 'function') {
        ctx.scale(dpr, dpr);
      }
    } catch (e) {
      console.warn("Retina scaling not supported:", e);
    }

    let isAlive = true;
    const getNow = () => {
      if (typeof window !== 'undefined' && window.performance && typeof window.performance.now === 'function') {
        try {
          return window.performance.now();
        } catch (e) {
          return Date.now();
        }
      }
      return Date.now();
    };

    const safeRequestAnimationFrame = (cb: () => void) => {
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        return window.requestAnimationFrame(cb);
      }
      return setTimeout(cb, 16) as any;
    };

    const safeCancelAnimationFrame = (id: any) => {
      if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(id);
      } else {
        clearTimeout(id);
      }
    };

    let lastTime = getNow();

    const animate = () => {
      if (!isAlive) return;

      try {
        const now = getNow();
        const delta = Math.min(10, Math.max(0.1, (now - lastTime) / 16.666)) || 1;
        lastTime = now;

        // Clear canvas
        if (typeof ctx.clearRect === 'function') {
          ctx.clearRect(0, 0, 128, 128);
        }

        const cx = 64;
        const cy = 64;

        // Decay burst intensity slowly
        if (burstIntensityRef.current > 0) {
          burstIntensityRef.current -= 0.02 * delta;
          if (burstIntensityRef.current < 0) burstIntensityRef.current = 0;
        }

        const timeMs = now * 0.004;

        // NEW: Draw glowing background ambient aura
        let themeColor = 'rgba(16, 185, 129, 0.15)'; // Emerald
        if (isSpeaking) {
          themeColor = 'rgba(245, 158, 11, 0.2)'; // Amber
        } else if (isListening) {
          themeColor = 'rgba(20, 184, 166, 0.18)'; // Teal
        }
        ctx.save();
        const bgGlow = ctx.createRadialGradient(cx, cy, 5, cx, cy, 32);
        bgGlow.addColorStop(0, themeColor);
        bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = bgGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 1. Draw and update shockwaves (Expanding Rings)
        const activeShockwaves = shockwavesRef.current;
        for (let i = activeShockwaves.length - 1; i >= 0; i--) {
          const wave = activeShockwaves[i];
          wave.radius += wave.speed * delta;
          wave.alpha -= 0.02 * delta;

          if (wave.radius >= wave.maxRadius || wave.alpha <= 0) {
            activeShockwaves.splice(i, 1);
            continue;
          }

          if (typeof ctx.beginPath === 'function') {
            ctx.beginPath();
            ctx.arc(cx, cy, wave.radius, 0, Math.PI * 2);
            ctx.strokeStyle = wave.color.replace(/[\d.]+\)$/, `${wave.alpha})`);
            ctx.lineWidth = wave.width;
            ctx.stroke();

            // Extra outer secondary glow ring
            ctx.beginPath();
            ctx.arc(cx, cy, wave.radius + 3, 0, Math.PI * 2);
            ctx.strokeStyle = wave.color.replace(/[\d.]+\)$/, `${wave.alpha * 0.3})`);
            ctx.lineWidth = 1.0;
            ctx.stroke();
          }
        }

        // 2. Draw and update Particle Starburst
        const activeParticles = particlesRef.current;
        for (let i = activeParticles.length - 1; i >= 0; i--) {
          const p = activeParticles[i];
          p.x += p.vx * delta;
          p.y += p.vy * delta;
          p.vx *= Math.pow(0.96, delta); // Decelerate/friction
          p.vy *= Math.pow(0.96, delta);
          p.alpha -= p.decay * delta;

          if (p.alpha <= 0) {
            activeParticles.splice(i, 1);
            continue;
          }

          if (typeof ctx.beginPath === 'function') {
            // Draw particle with motion blur trail
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color.replace(/[\d.]+\)$/, `${p.alpha})`);
            ctx.fill();

            // Shimmer sparkle
            if (Math.random() > 0.6) {
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size * 1.6, 0, Math.PI * 2);
              ctx.fillStyle = p.color.replace(/[\d.]+\)$/, `${p.alpha * 0.25})`);
              ctx.fill();
            }
          }
        }

        // NEW: Draw beautiful rotating outer sci-fi technical rings
        ctx.save();
        ctx.lineWidth = 1;
        // Ring 1 (Dashed Amber/Teal spinning clockwise)
        ctx.beginPath();
        ctx.arc(cx, cy, 25, 0, Math.PI * 2);
        ctx.strokeStyle = isSpeaking 
          ? 'rgba(245, 158, 11, 0.25)' 
          : isListening 
            ? 'rgba(20, 184, 166, 0.3)' 
            : 'rgba(16, 185, 129, 0.2)';
        ctx.setLineDash([4, 12]);
        ctx.translate(cx, cy);
        ctx.rotate(timeMs * 0.5);
        ctx.translate(-cx, -cy);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.lineWidth = 0.75;
        // Ring 2 (Finetoothed spinning counter-clockwise)
        ctx.beginPath();
        ctx.arc(cx, cy, 21, 0, Math.PI * 2);
        ctx.strokeStyle = isSpeaking 
          ? 'rgba(234, 179, 8, 0.15)' 
          : 'rgba(16, 185, 129, 0.15)';
        ctx.setLineDash([2, 5]);
        ctx.translate(cx, cy);
        ctx.rotate(-timeMs * 0.3);
        ctx.translate(-cx, -cy);
        ctx.stroke();
        ctx.restore();

        // NEW: Draw pulsing organic core sphere in center
        const corePulse = 16 + Math.sin(timeMs * 2.5) * 2 + (isSpeaking ? Math.sin(timeMs * 8) * 2.5 : 0);
        ctx.save();
        const coreGradient = ctx.createRadialGradient(cx, cy, 1, cx, cy, corePulse);
        if (isSpeaking) {
          coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
          coreGradient.addColorStop(0.3, 'rgba(234, 179, 8, 0.85)');
          coreGradient.addColorStop(0.7, 'rgba(245, 158, 11, 0.45)');
          coreGradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
        } else if (isListening) {
          coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
          coreGradient.addColorStop(0.3, 'rgba(45, 212, 191, 0.8)');
          coreGradient.addColorStop(0.7, 'rgba(20, 184, 166, 0.4)');
          coreGradient.addColorStop(1, 'rgba(13, 148, 136, 0)');
        } else {
          coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
          coreGradient.addColorStop(0.4, 'rgba(52, 211, 153, 0.6)');
          coreGradient.addColorStop(0.8, 'rgba(16, 185, 129, 0.25)');
          coreGradient.addColorStop(1, 'rgba(4, 120, 87, 0)');
        }
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(cx, cy, corePulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 3. Draw Radial Audio Spectrum (Equalizer bars projecting outward)
        // We animate them dynamically based on whether Aether is triggered, listening or speaking!
        const totalBars = 36;
        const baseRadius = 26; // Snugs right outside the circular mic icon button

        for (let i = 0; i < totalBars; i++) {
          const angle = (i / totalBars) * Math.PI * 2;
          
          // Base fluctuation based on state
          let waveHeight = 0;
          if (isSpeaking) {
            // Energetic speaking frequencies
            waveHeight = 3.0 + Math.sin(angle * 4 + timeMs * 3) * 4 + Math.sin(angle * 8 - timeMs * 2) * 3;
          } else if (isListening) {
            // Calmer listening frequencies
            waveHeight = 2.0 + Math.cos(angle * 3 + timeMs * 1.5) * 3 + Math.sin(angle * 7 + timeMs) * 1.5;
          } else if (isHubOpen) {
            // Subtle resting breathing wave
            waveHeight = 1.0 + Math.sin(angle * 2 + timeMs * 0.8) * 1.2;
          } else {
            // Minimal standby pulse
            waveHeight = 0.5 + Math.sin(angle + timeMs * 0.5) * 0.5;
          }

          // Inject burst boost on top of regular heights when wake-word is detected!
          if (burstIntensityRef.current > 0) {
            const radialBurstFactor = 15.0 * burstIntensityRef.current;
            const noiseComponent = Math.abs(Math.sin(angle * 12 + timeMs * 10)) * 6.0;
            waveHeight += (radialBurstFactor + noiseComponent);
          }

          const barLength = Math.max(0.5, waveHeight);
          const startX = cx + Math.cos(angle) * baseRadius;
          const startY = cy + Math.sin(angle) * baseRadius;
          const endX = cx + Math.cos(angle) * (baseRadius + barLength);
          const endY = cy + Math.sin(angle) * (baseRadius + barLength);

          // Determine color gradient based on wave height
          let barColor = 'rgba(16, 185, 129, 0.45)'; // Default emerald
          if (burstIntensityRef.current > 0) {
            // Shifting burst color (Gold to Amber gradient)
            const mixColor = i % 2 === 0 ? 'rgba(245, 158, 11, 0.8)' : 'rgba(234, 179, 8, 0.8)';
            barColor = mixColor;
          } else if (isSpeaking) {
            barColor = 'rgba(245, 158, 11, 0.7)'; // Amber-orange speaking wave
          } else if (isListening) {
            barColor = 'rgba(20, 184, 166, 0.65)'; // Teal listening wave
          }

          if (typeof ctx.beginPath === 'function') {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = barColor;
            ctx.lineWidth = 1.8;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        }
      } catch (err) {
        console.warn("Visualizer draw failed:", err);
      }

      animationRef.current = safeRequestAnimationFrame(animate);
    };

    animationRef.current = safeRequestAnimationFrame(animate);

    return () => {
      isAlive = false;
      if (animationRef.current) {
        safeCancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHubOpen, isListening, isSpeaking, isPowerSaving]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute pointer-events-none z-10"
      style={{
        width: '128px',
        height: '128px',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
};
