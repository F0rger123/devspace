import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Laptop, Headphones, Radio, ChevronDown, ChevronUp, Music, Sparkles } from 'lucide-react';
import { aetherSpotify, useSpotifyState } from '../../lib/aetherSpotifyEngine';

export function SpotifyMiniPlayer() {
  const spotifyState = useSpotifyState();
  const [isMinimized, setIsMinimized] = useState(false);
  const [progressMs, setProgressMs] = useState(0);

  useEffect(() => {
    setProgressMs(spotifyState.progressMs || 0);
  }, [spotifyState.progressMs]);

  // Live timer for progress bar advancement when playing
  useEffect(() => {
    if (!spotifyState.isPlaying || !spotifyState.currentTrack) return;

    const interval = setInterval(() => {
      setProgressMs(prev => {
        const total = spotifyState.currentTrack?.durationMs || 240000;
        if (prev >= total) {
          aetherSpotify.skip();
          return 0;
        }
        return prev + 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [spotifyState.isPlaying, spotifyState.currentTrack]);

  if (!spotifyState.isAuthenticated || (!spotifyState.isPlaying && !spotifyState.currentTrack)) {
    return null;
  }

  const currentTrack: { title: string; artist: string; album: string; durationMs: number; coverUrl?: string } = spotifyState.currentTrack || {
    title: 'Deep Focus Flow',
    artist: 'Aether Wave',
    album: 'Cosmic Coding',
    durationMs: 240000,
    coverUrl: undefined,
  };

  const durationMs = currentTrack.durationMs || 240000;
  const progressPercent = Math.min(100, Math.max(0, (progressMs / durationMs) * 100));

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const activeDevice = spotifyState.devices.find(d => d.id === spotifyState.activeDeviceId) || spotifyState.devices[0] || { name: 'DevSpace Player', type: 'Computer' };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-3xl bg-[#09090b]/95 border border-emerald-500/30 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl p-3 text-zinc-100 select-none overflow-hidden"
      >
        {/* Progress Bar (Top Accent) */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newPercent = clickX / rect.width;
            setProgressMs(Math.floor(newPercent * durationMs));
          }}
          className="absolute top-0 left-0 right-0 h-1 bg-zinc-800/80 cursor-pointer group"
        >
          <div
            className="h-full bg-emerald-500 group-hover:bg-emerald-400 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          {/* Left: Artwork + Track Details */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-950 to-zinc-900 border border-emerald-500/30 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
              {currentTrack?.coverUrl ? (
                <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
              ) : spotifyState.isPlaying ? (
                <div className="flex items-end gap-0.5 h-4">
                  <span className="w-0.5 bg-emerald-400 h-full animate-bounce"></span>
                  <span className="w-0.5 bg-emerald-400 h-2/3 animate-bounce delay-100"></span>
                  <span className="w-0.5 bg-emerald-400 h-4/5 animate-bounce delay-200"></span>
                </div>
              ) : (
                <Music size={18} className="text-emerald-400" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-100 truncate">{currentTrack.title}</span>
                <span className="px-1.5 py-0.2 text-[8px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                  Spotify
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 truncate">
                {currentTrack.artist} {currentTrack.album ? `— ${currentTrack.album}` : ''}
              </p>
            </div>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => aetherSpotify.toggleShuffle()}
              className={`p-1.5 rounded transition-colors ${spotifyState.shuffle ? 'text-emerald-400 bg-emerald-950/40' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Shuffle"
            >
              <Shuffle size={13} />
            </button>

            <button
              onClick={() => {
                aetherSpotify.previous();
              }}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded transition-colors cursor-pointer"
              title="Previous Track"
            >
              <SkipBack size={14} />
            </button>

            {spotifyState.isPlaying ? (
              <button
                onClick={() => aetherSpotify.pause()}
                className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full transition-transform active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/20"
                title="Pause"
              >
                <Pause size={15} />
              </button>
            ) : (
              <button
                onClick={() => aetherSpotify.resume()}
                className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full transition-transform active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/20"
                title="Play"
              >
                <Play size={15} className="ml-0.5" />
              </button>
            )}

            <button
              onClick={() => {
                aetherSpotify.skip();
                setProgressMs(0);
              }}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded transition-colors cursor-pointer"
              title="Next Track"
            >
              <SkipForward size={14} />
            </button>
          </div>

          {/* Right: Timer, Device, Volume */}
          <div className="hidden sm:flex items-center gap-3 shrink-0 text-xs text-zinc-400 font-mono">
            <div className="text-[10px]">
              <span>{formatTime(progressMs)}</span> / <span>{formatTime(durationMs)}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-emerald-400">
              {activeDevice.type === 'Headphones' ? <Headphones size={11} /> : <Laptop size={11} />}
              <span className="truncate max-w-[100px]">{activeDevice.name}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => aetherSpotify.setVolume(spotifyState.volume === 0 ? 80 : 0)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                {spotifyState.volume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={spotifyState.volume}
                onChange={(e) => aetherSpotify.setVolume(Number(e.target.value))}
                className="w-16 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
