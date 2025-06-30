'use client';

import { useState, useEffect, useRef } from 'react';
import { TrackInfo } from '@/lib/types';

interface VinylDeckProps {
  track: TrackInfo;
  isPlaying: boolean;
  currentTime: number;
  onSeek: (position: number) => void;
  bpm: number;
}

export function VinylDeck({ track, isPlaying, currentTime, onSeek, bpm }: VinylDeckProps) {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hover, setHover] = useState(false);
  const rotationRef = useRef(0);
  const animationRef = useRef<number>();
  const deckRef = useRef<HTMLDivElement>(null);

  const rpm = bpm * 0.4; // Approximate vinyl RPM based on BPM
  const degreesPerSecond = (rpm / 60) * 360;

  useEffect(() => {
    if (isPlaying && !isDragging) {
      const animate = () => {
        rotationRef.current += degreesPerSecond / 60; // 60fps
        setRotation(rotationRef.current);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isDragging, degreesPerSecond]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!deckRef.current) return;
      
      const rect = deckRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
      const normalizedAngle = (angle * 180 / Math.PI + 360) % 360;
      
      const seekPosition = (normalizedAngle / 360) * track.duration;
      onSeek(seekPosition);
      
      rotationRef.current = normalizedAngle;
      setRotation(normalizedAngle);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const progressAngle = (currentTime / track.duration) * 360;
  const stylusAngle = progressAngle;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* BPM Display */}
      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-green-500/30">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{Math.round(bpm)}</div>
          <div className="text-xs text-green-400/70">BPM</div>
        </div>
      </div>

      {/* Vinyl Deck */}
      <div className="relative">
        {/* Platter */}
        <div
          ref={deckRef}
          className={`
            relative w-48 h-48 rounded-full cursor-pointer transition-all duration-200
            bg-gradient-to-br from-gray-900 via-black to-gray-800
            border-4 border-gray-700
            ${hover ? 'shadow-lg shadow-cyan-500/30' : 'shadow-lg shadow-black/50'}
            ${isDragging ? 'scale-105' : ''}
          `}
          style={{
            transform: `rotate(${rotation}deg)`,
            backgroundImage: `
              conic-gradient(from 0deg, 
                transparent 0deg, 
                rgba(59, 130, 246, 0.1) 2deg, 
                transparent 4deg, 
                rgba(59, 130, 246, 0.1) 6deg, 
                transparent 8deg
              ),
              radial-gradient(circle at center, 
                rgba(0, 0, 0, 0.8) 30%, 
                rgba(20, 20, 20, 0.9) 60%, 
                rgba(0, 0, 0, 1) 100%
              )
            `
          }}
          onMouseDown={handleMouseDown}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {/* Vinyl Grooves */}
          <div className="absolute inset-2 rounded-full border border-blue-500/20" />
          <div className="absolute inset-4 rounded-full border border-blue-500/15" />
          <div className="absolute inset-6 rounded-full border border-blue-500/10" />
          <div className="absolute inset-8 rounded-full border border-blue-500/10" />
          
          {/* Center Label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-full border border-gray-600 flex items-center justify-center">
              <div className="w-3 h-3 bg-gray-400 rounded-full" />
            </div>
          </div>
          
          {/* Album Art or Title */}
          <div className="absolute inset-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-cyan-500/20">
            <div className="text-center px-2">
              <div className="text-xs font-bold text-cyan-400 truncate max-w-full">
                {track.title}
              </div>
              <div className="text-xs text-cyan-400/70 truncate max-w-full">
                {track.artist}
              </div>
            </div>
          </div>
        </div>

        {/* Stylus */}
        <div
          className="absolute top-4 left-1/2 origin-bottom"
          style={{
            transform: `translateX(-50%) rotate(${stylusAngle}deg)`,
            transformOrigin: '50% 90px'
          }}
        >
          <div className="w-1 h-20 bg-gradient-to-t from-white via-gray-300 to-white rounded-full shadow-lg shadow-white/50" />
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-lg shadow-white/75" />
        </div>

        {/* Progress Ring */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="96"
              fill="none"
              stroke="rgba(59, 130, 246, 0.2)"
              strokeWidth="2"
            />
            <circle
              cx="100"
              cy="100"
              r="96"
              fill="none"
              stroke="rgba(59, 130, 246, 0.8)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="603"
              strokeDashoffset={603 - (progressAngle / 360) * 603}
              className="transition-all duration-100"
            />
          </svg>
        </div>
      </div>

      {/* Time Display */}
      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-cyan-500/30">
        <div className="text-center">
          <div className="text-sm font-mono text-cyan-400">
            {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-cyan-400/70">
            / {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    </div>
  );
}