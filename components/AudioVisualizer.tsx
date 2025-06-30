'use client';

import { useEffect, useRef, useState } from 'react';
import { AudioEngine } from '@/lib/AudioEngine';

interface AudioVisualizerProps {
  audioEngine: AudioEngine;
}

export function AudioVisualizer({ audioEngine }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [visualMode, setVisualMode] = useState<'frequency' | 'waveform' | 'energy' | 'spiral'>('frequency');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyzer = audioEngine.getAnalyzer();
    const bufferLength = analyzer.frequencyBinCount;

    const draw = () => {
      const frequencyData = audioEngine.getFrequencyData();
      const timeDomainData = audioEngine.getTimeDomainData();
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      switch (visualMode) {
        case 'frequency':
          drawFrequencyBars(ctx, frequencyData, canvas.width, canvas.height);
          break;
        case 'waveform':
          drawLiquidWaveform(ctx, timeDomainData, canvas.width, canvas.height);
          break;
        case 'energy':
          drawEnergyTowers(ctx, frequencyData, canvas.width, canvas.height);
          break;
        case 'spiral':
          drawHarmonicSpiral(ctx, frequencyData, canvas.width, canvas.height);
          break;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioEngine, visualMode]);

  const drawFrequencyBars = (ctx: CanvasRenderingContext2D, data: Uint8Array, width: number, height: number) => {
    const barWidth = width / data.length * 2.5;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const barHeight = (data[i] / 255) * height * 0.8;
      
      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      if (i < data.length / 3) {
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)'); // Red for bass
        gradient.addColorStop(1, 'rgba(255, 165, 0, 1)'); // Orange
      } else if (i < (data.length * 2) / 3) {
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.8)'); // Green for mids
        gradient.addColorStop(1, 'rgba(59, 130, 246, 1)'); // Blue
      } else {
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)'); // Blue for highs
        gradient.addColorStop(1, 'rgba(236, 72, 153, 1)'); // Pink
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      
      x += barWidth + 1;
    }
  };

  const drawLiquidWaveform = (ctx: CanvasRenderingContext2D, data: Uint8Array, width: number, height: number) => {
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.8)'; // Magenta
    ctx.beginPath();

    const sliceWidth = width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();

    // Add glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(236, 72, 153, 0.5)';
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawEnergyTowers = (ctx: CanvasRenderingContext2D, data: Uint8Array, width: number, height: number) => {
    const numTowers = 8;
    const towerWidth = width / numTowers - 10;
    
    for (let i = 0; i < numTowers; i++) {
      const startIndex = Math.floor(i * data.length / numTowers);
      const endIndex = Math.floor((i + 1) * data.length / numTowers);
      
      let sum = 0;
      for (let j = startIndex; j < endIndex; j++) {
        sum += data[j];
      }
      const average = sum / (endIndex - startIndex);
      
      const towerHeight = (average / 255) * height * 0.9;
      const x = i * (towerWidth + 10) + 5;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, height, 0, height - towerHeight);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)'); // Blue
      gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 1)'); // White
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - towerHeight, towerWidth, towerHeight);
      
      // Add glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
      ctx.fillRect(x, height - towerHeight, towerWidth, towerHeight);
      ctx.shadowBlur = 0;
    }
  };

  const drawHarmonicSpiral = (ctx: CanvasRenderingContext2D, data: Uint8Array, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 3;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < data.length; i++) {
      const angle = (i / data.length) * Math.PI * 4; // Multiple spirals
      const amplitude = (data[i] / 255) * maxRadius;
      const x = centerX + Math.cos(angle) * amplitude;
      const y = centerY + Math.sin(angle) * amplitude;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Add glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const visualModes = [
    { id: 'frequency', label: 'Frequency' },
    { id: 'waveform', label: 'Waveform' },
    { id: 'energy', label: 'Energy' },
    { id: 'spiral', label: 'Spiral' }
  ] as const;

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Mode Selector */}
      <div className="flex space-x-1">
        {visualModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setVisualMode(mode.id)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              visualMode === mode.id
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/40'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Visualizer Canvas */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm rounded-xl border border-cyan-500/20 p-4">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="w-full h-full rounded-lg"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
}