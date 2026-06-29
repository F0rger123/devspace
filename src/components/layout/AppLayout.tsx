import React, { ReactNode, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { Header } from './Header';
import { CommandPalette } from '../ui/CommandPalette';
import { VoiceMemoAssistant } from '../ui/VoiceMemoAssistant';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataProvider';

const EMBERS = [
  { left: '4%', size: '3px', delay: '0s', type: 'animate-ember-1', blur: '0.5px' },
  { left: '12%', size: '2px', delay: '3s', type: 'animate-ember-2', blur: '0px' },
  { left: '19%', size: '4px', delay: '7s', type: 'animate-ember-3', blur: '1px' },
  { left: '28%', size: '1.5px', delay: '1s', type: 'animate-ember-4', blur: '0px' },
  { left: '38%', size: '3.5px', delay: '12s', type: 'animate-ember-5', blur: '0.5px' },
  { left: '47%', size: '5px', delay: '5s', type: 'animate-ember-1', blur: '1.5px' },
  { left: '56%', size: '2px', delay: '15s', type: 'animate-ember-2', blur: '0px' },
  { left: '65%', size: '3px', delay: '8s', type: 'animate-ember-3', blur: '0.5px' },
  { left: '74%', size: '1.8px', delay: '2s', type: 'animate-ember-4', blur: '0px' },
  { left: '83%', size: '4.5px', delay: '10s', type: 'animate-ember-5', blur: '1px' },
  { left: '91%', size: '3px', delay: '14s', type: 'animate-ember-2', blur: '0.5px' },
  { left: '96%', size: '2.5px', delay: '6s', type: 'animate-ember-3', blur: '0px' },
];

function InteractiveAura({ size = 420, opacityClass = "from-amber-500/12 via-yellow-500/6 to-orange-500/10" }: { size?: number, opacityClass?: string }) {
  const auraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frameId: number;
    let targetX = 50;
    let targetY = 50;
    let currentX = 50;
    let currentY = 50;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth) * 100;
      targetY = (e.clientY / window.innerHeight) * 100;
    };

    const updatePosition = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      
      const pulseVal = 1 + Math.sin(Date.now() * 0.002) * 0.05;

      if (auraRef.current) {
        auraRef.current.style.left = `${currentX}%`;
        auraRef.current.style.top = `${currentY}%`;
        auraRef.current.style.width = `${size * pulseVal}px`;
        auraRef.current.style.height = `${size * pulseVal}px`;
      }

      frameId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('mousemove', handleMouseMove);
    frameId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(frameId);
    };
  }, [size]);

  return (
    <div 
      ref={auraRef}
      className={`absolute rounded-full bg-gradient-to-tr ${opacityClass} blur-[130px] transition-all duration-300 ease-out pointer-events-none`}
      style={{
        left: '50%',
        top: '50%',
        width: `${size}px`,
        height: `${size}px`,
        transform: `translate(-50%, -50%)`,
      }}
    />
  );
}

export function CursorAmbers() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: width / 2, y: height / 2, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      baseAlpha: number;
      angle: number;
      angularSpeed: number;
      orbitRadius: number;
      color: string;
      glow: number;
    }

    const particles: Particle[] = [];
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const orbitRadius = 15 + Math.random() * 55;
      particles.push({
        x: mouse.x + Math.cos(angle) * orbitRadius,
        y: mouse.y + Math.sin(angle) * orbitRadius,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 1 + Math.random() * 2.5,
        alpha: 0.3 + Math.random() * 0.7,
        baseAlpha: 0.3 + Math.random() * 0.7,
        angle: angle,
        angularSpeed: (Math.random() - 0.5) * 0.04,
        orbitRadius: orbitRadius,
        color: i % 3 === 0 
          ? '245, 158, 11' // amber-500
          : i % 3 === 1 
            ? '234, 179, 8' // yellow-500
            : '249, 115, 22', // orange-500
        glow: 4 + Math.random() * 10
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const targetX = mouse.x;
      const targetY = mouse.y;

      particles.forEach((p) => {
        const dx = targetX - p.x;
        const dy = targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (mouse.active) {
          // Elastic attraction pull
          const pull = Math.min(0.2, 110 / dist);
          p.vx += (dx / dist) * pull * 0.14;
          p.vy += (dy / dist) * pull * 0.14;

          // Elegant swirl/orbit path around target
          const swirlForce = 0.045;
          p.vx += (-dy / dist) * swirlForce;
          p.vy += (dx / dist) * swirlForce;
        } else {
          // Slow passive drift
          p.vx += (Math.random() - 0.5) * 0.04;
          p.vy += (Math.random() - 0.5) * 0.04 - 0.015;
        }

        // Brownian noise to make them dance
        p.vx += (Math.random() - 0.5) * 0.15;
        p.vy += (Math.random() - 0.5) * 0.15;

        // Air friction
        p.vx *= 0.94;
        p.vy *= 0.94;

        p.x += p.vx;
        p.y += p.vy;

        // Clamp inside window boundaries
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        p.angle += p.angularSpeed;
        p.alpha = p.baseAlpha + Math.sin(p.angle * 1.5) * 0.2;
        p.alpha = Math.max(0.1, Math.min(1.0, p.alpha));

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        ctx.shadowColor = `rgba(${p.color}, 0.85)`;
        ctx.shadowBlur = p.glow;
        
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[2] opacity-80" />;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { isAssistantOpen, isAssistantMinimized } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const isAssistantRoute = location.pathname === '/assistant';
  const isWhatsAppRoute = location.pathname === '/whatsapp-companion';

  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.path) {
        navigate(customEvent.detail.path);
      }
    };
    window.addEventListener('aether-pc-navigate', handleNavigate);
    return () => window.removeEventListener('aether-pc-navigate', handleNavigate);
  }, [navigate]);

  if (isWhatsAppRoute) {
    return (
      <div className="h-screen w-full bg-[#030305] starry-background text-zinc-100 overflow-hidden select-none relative">
        {/* Slow drifting gold-amber embers background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* Interactive mouse-following neon aura */}
          <InteractiveAura size={380} opacityClass="from-amber-500/10 via-yellow-500/5 to-orange-500/10" />
          {/* Interactive cursor ambers swarm */}
          <CursorAmbers />
          {/* Drifting embers */}
          {EMBERS.map((ember, i) => (
            <div
              key={i}
              className={`absolute rounded-full bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.7)] ${ember.type}`}
              style={{
                left: ember.left,
                width: ember.size,
                height: ember.size,
                animationDelay: ember.delay,
                filter: ember.blur ? `blur(${ember.blur})` : undefined,
              }}
            />
          ))}
          <div className="absolute inset-0 opacity-45 bg-[radial-gradient(1.5px_1.5px_at_120px_150px,#ffffff_100%,rgba(0,0,0,0))] bg-[size:180px_180px] animate-space-star" />
        </div>
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
        <VoiceMemoAssistant />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#030305] starry-background text-zinc-300 font-sans overflow-hidden select-none selection:bg-yellow-400/30 relative">
      {/* Slow drifting gold-amber embers background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Interactive mouse-following neon aura */}
        <InteractiveAura size={420} opacityClass="from-amber-500/12 via-yellow-500/6 to-orange-500/10" />
        {/* Interactive cursor ambers swarm */}
        <CursorAmbers />

        {/* Drifting embers */}
        {EMBERS.map((ember, i) => (
          <div
            key={i}
            className={`absolute rounded-full bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.7)] ${ember.type}`}
            style={{
              left: ember.left,
              width: ember.size,
              height: ember.size,
              animationDelay: ember.delay,
              filter: ember.blur ? `blur(${ember.blur})` : undefined,
            }}
          />
        ))}
        
        {/* Micro-star twinkle layers */}
        <div className="absolute inset-0 opacity-35 bg-[radial-gradient(1.2px_1.2px_at_80px_100px,#ffffff_100%,rgba(0,0,0,0))] bg-[size:220px_220px] animate-space-star" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(2px_2px_at_150px_270px,#f59e0b_100%,rgba(0,0,0,0))] bg-[size:380px_380px] animate-space-star [animation-delay:-4s]" />
      </div>

      <div className="relative z-10 flex flex-col h-full w-full overflow-hidden">
        <Header />
        <div className="flex flex-grow overflow-hidden relative">
          <Sidebar />
          <main className={`flex-grow flex flex-col min-w-0 overflow-hidden bg-transparent transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isAssistantOpen && isAssistantMinimized ? 'mr-[440px]' : ''
          }`}>
            <div className={`flex-grow overflow-y-auto ${isAssistantRoute ? 'p-0' : 'p-4 lg:p-6'} shadow-[inset_0_4px_32px_rgba(0,0,0,0.85)]`}>
              <div className="w-full min-h-full flex flex-col">
                {children}
              </div>
            </div>
          </main>
          {!isAssistantRoute && !isAssistantOpen && <RightSidebar />}
        </div>
        <CommandPalette />
        <VoiceMemoAssistant />
      </div>
    </div>
  );
}
