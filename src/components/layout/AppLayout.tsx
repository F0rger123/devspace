import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { Header } from './Header';
import { CustomTitleBar } from './CustomTitleBar';
import { isElectron, getElectronAPI } from '../../lib/electronBridge';
import { CommandPalette } from '../ui/CommandPalette';
import { VoiceMemoAssistant } from '../ui/VoiceMemoAssistant';
import { KineticController } from '../ui/KineticController';
import { KineticHUDOverlay } from '../ui/KineticHUDOverlay';
import { CursorDrawContext } from '../ui/CursorDrawContext';
import { GlobalHotkeyHandler } from '../ui/GlobalHotkeyHandler';
import { ActivityCenterPill } from '../ui/ActivityCenterPill';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataProvider';
import { useStore } from '../../store';
import { AuthScreen } from '../auth/AuthScreen';
import { SetupWizard } from '../auth/SetupWizard';
import { Users } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/auth';

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

function InteractiveAura({ size = 420, opacityClass = "from-amber-500/5 via-yellow-500/2 to-transparent", active = true }: { size?: number, opacityClass?: string, active?: boolean }) {
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
      className={`absolute rounded-full bg-gradient-to-tr ${opacityClass} blur-[130px] transition-all duration-700 ease-out pointer-events-none ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
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
          // High speed elastic attraction pull
          const pull = Math.min(0.8, 300 / dist);
          p.vx += (dx / dist) * pull * 0.42;
          p.vy += (dy / dist) * pull * 0.42;

          // High-velocity orbital swirl vortex path around mouse pointer
          const swirlForce = 0.14;
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
  const { isSidebarOpen, toggleSidebar, setSidebarOpen, isRightSidebarOpen, toggleRightSidebar, isKineticEnabled } = useStore();
  const { isAssistantOpen, isAssistantMinimized, setIsAssistantMinimized, googleUser, acceptInvitation, declineInvitation, userProfile } = useData();

  useEffect(() => {
    if (isKineticEnabled && isAssistantOpen && !isAssistantMinimized) {
      setIsAssistantMinimized(true);
    }
  }, [isKineticEnabled, isAssistantOpen, isAssistantMinimized, setIsAssistantMinimized]);

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 0) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const duration = Date.now() - startTime;
      
      const diffX = endX - startX;
      const diffY = endY - startY;

      // Make expansion (swiping right) much more responsive: 40px for quick flicks, 75px for slow swipes
      const isSwipingRight = diffX > 0;
      const minDistance = isSwipingRight 
        ? (duration < 300 ? 40 : 75)
        : (duration < 300 ? 65 : 110);
      
      // Horizontal swipes must be generally horizontal (lower angle requirement for expansion to be more responsive)
      const angleRatio = isSwipingRight ? 1.15 : 1.35;
      if (Math.abs(diffX) > minDistance && Math.abs(diffX) > Math.abs(diffY) * angleRatio) {
        if (diffX > 0) {
          // Swipe right -> Open sidebar (initiated in the left 60% of the screen for easier reach)
          if (window.innerWidth < 768 && startX < window.innerWidth * 0.6) {
            setSidebarOpen(true);
          }
        } else {
          // Swipe left -> Close sidebar (initiated anywhere on the screen)
          if (window.innerWidth < 768) {
            setSidebarOpen(false);
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [setSidebarOpen]);
  const location = useLocation();
  const navigate = useNavigate();
  const isAssistantRoute = location.pathname === '/assistant';
  const isWhatsAppRoute = location.pathname === '/whatsapp-companion';

  useEffect(() => {
    const api = getElectronAPI();
    if (api && api.onNavigateTo) {
      const unsub = api.onNavigateTo((route) => {
        navigate(route);
      });
      return unsub;
    }

    const handleCustomNav = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        navigate(customEvent.detail);
      }
    };
    window.addEventListener('devspace:navigate-main', handleCustomNav);
    return () => window.removeEventListener('devspace:navigate-main', handleCustomNav);
  }, [navigate]);

  useEffect(() => {
    // Force reset of main content scroll containers back to top on page route change
    window.scrollTo(0, 0);
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTop = 0;
      const scrollables = mainContent.querySelectorAll('.overflow-y-auto');
      scrollables.forEach((el) => {
        el.scrollTop = 0;
      });
    }
  }, [location.pathname]);

  const [activeInvite, setActiveInvite] = useState<any | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteStatusMsg, setInviteStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const inviteId = params.get('inviteId') || params.get('invite');
    if (inviteId && googleUser) {
      const fetchInviteFromLink = async () => {
        try {
          const inviteRef = doc(db, 'invitations', inviteId);
          const snap = await getDoc(inviteRef);
          if (snap.exists()) {
            const inviteData = snap.data();
            const myEmail = (googleUser.email || '').trim().toLowerCase();
            const receiverEmail = (inviteData.receiverEmail || '').trim().toLowerCase();
            
            if (myEmail !== receiverEmail) {
              setInviteError(`This invitation link is for ${inviteData.receiverEmail}, but you are currently signed in as ${googleUser.email}.`);
            } else if (inviteData.status !== 'pending') {
              setInviteError(`This invitation has already been ${inviteData.status}.`);
            } else {
              setActiveInvite(inviteData);
              setInviteError(null);
            }
          } else {
            setInviteError("The invitation link is invalid or has expired.");
          }
        } catch (err: any) {
          console.error("Error fetching invitation details:", err);
          setInviteError("Failed to load invitation details.");
        }
      };
      fetchInviteFromLink();
    }
  }, [location.search, googleUser]);

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

  const [isStandaloneMode, setIsStandaloneMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('desktop') === 'true' || params.get('standalone') === 'true' || params.get('mode') === 'desktop') {
      localStorage.setItem('devspace_standalone_mode', 'true');
      return true;
    }
    return localStorage.getItem('devspace_standalone_mode') === 'true';
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('desktop') === 'true' || params.get('standalone') === 'true' || params.get('mode') === 'desktop') {
      localStorage.setItem('devspace_standalone_mode', 'true');
      setIsStandaloneMode(true);
    }

    const handleToggle = () => {
      setIsStandaloneMode(localStorage.getItem('devspace_standalone_mode') === 'true');
    };
    window.addEventListener('devspace-standalone-toggle', handleToggle);
    return () => window.removeEventListener('devspace-standalone-toggle', handleToggle);
  }, [location.search]);

  if (!googleUser) {
    return <AuthScreen />;
  }

  if (isWhatsAppRoute) {
    return (
      <div className="h-screen w-full bg-[#030305] starry-background text-zinc-100 overflow-hidden select-none relative">
        {/* Slow drifting gold-amber embers background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* Interactive mouse-following neon aura */}
          <InteractiveAura size={380} opacityClass="from-amber-500/6 via-yellow-500/2 to-transparent" active={isAssistantOpen} />
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
        <InteractiveAura size={420} opacityClass="from-amber-500/6 via-yellow-500/2 to-transparent" active={isAssistantOpen} />
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
        {isElectron() && <CustomTitleBar />}
        <Header />
        <div className="flex flex-grow overflow-hidden relative">
          <Sidebar />

          {/* Mobile Sidebar Backdrop */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden absolute inset-0 bg-black/70 backdrop-blur-xs z-35 cursor-pointer"
                onClick={toggleSidebar}
              />
            )}
          </AnimatePresence>

          <main className={`flex-grow flex flex-col min-w-0 ${isAssistantRoute ? 'h-full overflow-hidden' : 'md:overflow-hidden overflow-y-auto'} bg-transparent transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isAssistantOpen && isAssistantMinimized ? 'md:mr-[440px]' : ''
          }`}>
            <div className={`flex-grow ${isAssistantRoute ? 'p-0 h-full overflow-hidden' : 'md:overflow-hidden overflow-y-auto p-3 md:p-6'} shadow-[inset_0_4px_32px_rgba(0,0,0,0.85)]`}>
              <div className={`w-full flex flex-col ${isAssistantRoute ? 'h-full overflow-hidden' : 'h-auto md:h-full md:overflow-hidden'}`}>
                {children}
              </div>
            </div>
          </main>

          {/* Mobile RightSidebar Backdrop */}
          <AnimatePresence>
            {isRightSidebarOpen && !isAssistantRoute && !isAssistantOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden absolute inset-0 bg-black/70 backdrop-blur-xs z-35 cursor-pointer"
                onClick={toggleRightSidebar}
              />
            )}
          </AnimatePresence>

          {!isAssistantRoute && !isAssistantOpen && <RightSidebar />}
        </div>
        <CommandPalette />
        <ActivityCenterPill />
        <VoiceMemoAssistant />
        <KineticController />
        <KineticHUDOverlay />
        <CursorDrawContext />
        <GlobalHotkeyHandler />
        {userProfile && <SetupWizard />}
      </div>

      {/* Dynamic Invitation Link Handler Overlay Modal */}
      {(activeInvite || inviteError) && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-[#0a0a0c] border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
          >
            {/* Elegant Amber Aura inside modal */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-500/10 blur-[50px] rounded-full pointer-events-none" />
            
            {inviteError ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
                  <span className="text-xl font-bold">!</span>
                </div>
                <h3 className="text-base font-bold text-zinc-100 font-sans">Invitation Issue</h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">{inviteError}</p>
                <button
                  onClick={() => {
                    setInviteError(null);
                    // Clear the URL parameter
                    const params = new URLSearchParams(location.search);
                    params.delete('inviteId');
                    params.delete('invite');
                    navigate({ search: params.toString() }, { replace: true });
                  }}
                  className="w-full py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold font-mono border border-zinc-750 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">Workspace Invitation</h3>
                    <p className="text-[11px] text-zinc-500 font-sans">You have been invited to collaborate</p>
                  </div>
                </div>

                <div className="p-4 bg-zinc-900/60 border border-zinc-850 rounded-xl space-y-3">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-mono block uppercase">Project to Join</span>
                    <span className="text-sm font-bold text-zinc-200">📁 {activeInvite.projectName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-zinc-850">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono block uppercase">Invited By</span>
                      <span className="text-xs text-zinc-300 font-mono truncate block">{activeInvite.senderEmail}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono block uppercase">Offered Role</span>
                      <span className="text-xs text-yellow-500 font-mono capitalize font-bold">{activeInvite.role || 'editor'}</span>
                    </div>
                  </div>
                </div>

                {inviteStatusMsg ? (
                  <p className="text-center text-xs font-mono text-zinc-400 py-2 animate-pulse">{inviteStatusMsg}</p>
                ) : (
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={async () => {
                        try {
                          setInviteStatusMsg("Accepting invitation...");
                          await acceptInvitation(activeInvite.id);
                          setInviteStatusMsg("Successfully joined project!");
                          setTimeout(() => {
                            setActiveInvite(null);
                            setInviteStatusMsg(null);
                            const params = new URLSearchParams(location.search);
                            params.delete('inviteId');
                            params.delete('invite');
                            navigate('/projects', { replace: true });
                          }, 1500);
                        } catch (err) {
                          setInviteStatusMsg("Failed to accept invitation.");
                        }
                      }}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer text-center"
                    >
                      Accept & Join
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          setInviteStatusMsg("Declining invitation...");
                          await declineInvitation(activeInvite.id);
                          setInviteStatusMsg("Declined successfully.");
                          setTimeout(() => {
                            setActiveInvite(null);
                            setInviteStatusMsg(null);
                            const params = new URLSearchParams(location.search);
                            params.delete('inviteId');
                            params.delete('invite');
                            navigate({ search: params.toString() }, { replace: true });
                          }, 1000);
                        } catch (err) {
                          setInviteStatusMsg("Failed to decline.");
                        }
                      }}
                      className="py-2 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold text-xs rounded-lg border border-zinc-800 transition-colors cursor-pointer text-center"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
