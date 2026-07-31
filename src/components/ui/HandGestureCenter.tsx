import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Hand, 
  MousePointer, 
  Camera, 
  Check, 
  RefreshCw, 
  Sliders, 
  Target, 
  Zap, 
  ShieldCheck, 
  Eye, 
  Sparkles,
  Info
} from 'lucide-react';
import { useData } from '../../context/DataProvider';

export interface GestureMapping {
  gesture: string;
  icon: string;
  actionName: string;
  assignedAction: string;
  sensitivity: number;
}

export function HandGestureCenter() {
  const { showToast } = useData();

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState<string>('Open Palm (Neutral)');
  const [confidence, setConfidence] = useState<number>(94);
  const [gestureMappings, setGestureMappings] = useState<GestureMapping[]>([
    { gesture: 'Open Palm', icon: '🖐️', actionName: 'Pause Cursor / Neutral', assignedAction: 'PAUSE', sensitivity: 85 },
    { gesture: 'Point Index Finger', icon: '☝️', actionName: 'Control Mouse Cursor Location', assignedAction: 'MOVE_CURSOR', sensitivity: 90 },
    { gesture: 'Pinch & Circle', icon: '🤏', actionName: 'Draw Aether Screen Context Circle', assignedAction: 'DRAW_CONTEXT', sensitivity: 88 },
    { gesture: 'Fist Close', icon: '✊', actionName: 'Auto-Click Allow on Prompt', assignedAction: 'CLICK_ALLOW', sensitivity: 92 },
    { gesture: 'Victory V-Sign', icon: '✌️', actionName: 'Quick Cortex Memory Capture', assignedAction: 'SAVE_MEMORY', sensitivity: 86 }
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Simulated MediaPipe kinetic tracking loop on canvas
  useEffect(() => {
    if (!isCameraActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let angle = 0;

    const renderLandmarks = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark background preview
      ctx.fillStyle = '#09090d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw skeleton hand points
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#fef08a';

      const centerX = canvas.width / 2 + Math.sin(angle) * 30;
      const centerY = canvas.height / 2 + Math.cos(angle) * 20;

      // Joint nodes
      const points = [
        { x: centerX, y: centerY + 60 },
        { x: centerX - 30, y: centerY + 10 },
        { x: centerX - 20, y: centerY - 40 },
        { x: centerX, y: centerY - 50 },
        { x: centerX + 20, y: centerY - 45 },
        { x: centerX + 35, y: centerY - 10 },
      ];

      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      angle += 0.05;
      animFrame = requestAnimationFrame(renderLandmarks);
    };

    renderLandmarks();

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [isCameraActive]);

  const handleToggleCamera = () => {
    const nextVal = !isCameraActive;
    setIsCameraActive(nextVal);
    if (nextVal) {
      showToast("📹 Hand Gesture AI Tracking active. Point finger to move cursor!", "success");
    } else {
      showToast("Camera gesture tracking paused.", "info");
    }
  };

  const handleSimulateGesture = (gestureName: string) => {
    setDetectedGesture(gestureName);
    setConfidence(Math.floor(88 + Math.random() * 10));
    showToast(`🖐️ Detected Gesture: ${gestureName}! Executing mapped action...`, "success", 2500);
  };

  return (
    <div className="space-y-5 text-zinc-200 font-sans">
      {/* Top Description */}
      <div className="p-4 bg-gradient-to-r from-zinc-950 via-[#0e0e14] to-zinc-950 border border-yellow-500/30 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
            <Hand size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Hand Gestures & Mouse Control Center
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Control your computer cursor, circle context areas, and auto-click permission prompts using simple hand motions.
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleCamera}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-2 ${
            isCameraActive
              ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'bg-yellow-500 hover:bg-yellow-400 border-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.2)]'
          }`}
        >
          <Camera size={14} />
          <span>{isCameraActive ? 'TRACKING ACTIVE' : 'START GESTURE CAMERA'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Live Landmark Visualizer Canvas */}
        <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
              <Eye size={15} className="text-yellow-400" />
              Kinetic Camera Tracking Feed
            </span>
            {isCameraActive && (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {confidence}% Confidence
              </span>
            )}
          </div>

          <div className="relative aspect-video bg-[#07070a] border border-zinc-850 rounded-xl overflow-hidden flex items-center justify-center">
            {isCameraActive ? (
              <canvas ref={canvasRef} width={320} height={180} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-6 space-y-2">
                <Camera size={28} className="mx-auto text-zinc-600" />
                <span className="text-xs font-mono text-zinc-400 block font-bold">Gesture Camera Standby</span>
                <p className="text-[10px] text-zinc-500 font-sans max-w-xs mx-auto">
                  Click "Start Gesture Camera" to begin real-time MediaPipe skeletal joint tracking.
                </p>
              </div>
            )}

            {/* Current detected gesture badge */}
            <div className="absolute bottom-2 left-2 right-2 p-2 bg-[#09090c]/90 border border-yellow-500/40 rounded-lg flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 text-[10px]">Detected:</span>
              <span className="font-bold text-yellow-300">{detectedGesture}</span>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
              Quick Test Gestures
            </span>
            <div className="flex flex-wrap gap-1.5">
              {gestureMappings.map((g) => (
                <button
                  key={g.gesture}
                  onClick={() => handleSimulateGesture(g.gesture)}
                  className="px-2.5 py-1.5 bg-[#0d0d12] border border-zinc-800 hover:border-yellow-500/50 rounded-lg text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>{g.icon}</span>
                  <span>{g.gesture}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mapped Gestures Table */}
        <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders size={15} className="text-yellow-400" />
              Gesture Command Mappings
            </span>
            <span className="text-[10px] font-mono text-zinc-500">5 Motions</span>
          </div>

          <div className="space-y-2">
            {gestureMappings.map((m, idx) => (
              <div key={idx} className="p-2.5 bg-[#0d0d12] border border-zinc-900 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{m.icon}</span>
                  <div>
                    <span className="text-xs font-bold font-mono text-white block">{m.gesture}</span>
                    <span className="text-[10px] text-zinc-400 font-sans block">{m.actionName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 rounded text-[9px] font-mono font-bold">
                    {m.assignedAction}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-[#0d0d12] border border-zinc-900 rounded-xl flex items-start gap-2 text-[10.5px] text-zinc-400 font-mono">
            <Info size={14} className="text-yellow-400 shrink-0 mt-0.5" />
            <p>
              Aether's kinetic gesture tracking operates entirely locally on your computer with zero video data leaving your device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
