'use client';

import { useState, useEffect, useRef } from 'react';
import { AudioEngine } from '@/lib/AudioEngine';
import { AudioVisualizer } from '@/components/AudioVisualizer';

interface MixerControlsProps {
  audioEngine: AudioEngine;
}

export function MixerControls({ audioEngine }: MixerControlsProps) {
  const [crossfader, setCrossfader] = useState(0);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [cueVolume, setCueVolume] = useState(0.5);

  const handleCrossfaderChange = (value: number) => {
    setCrossfader(value);
    audioEngine.setCrossfader(value);
  };

  const handleMasterVolumeChange = (value: number) => {
    setMasterVolume(value);
    audioEngine.setMasterVolume(value);
  };

  const handleCueVolumeChange = (value: number) => {
    setCueVolume(value);
    audioEngine.setCueVolume(value);
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6 h-full">
      <div className="flex flex-col h-full space-y-6">
        {/* Mixer Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-magenta-400 bg-clip-text text-transparent">
            MIXER
          </h2>
        </div>

        {/* Audio Visualizer */}
        <div className="flex-1 min-h-0">
          <AudioVisualizer audioEngine={audioEngine} />
        </div>

        {/* Master Volume */}
        <div className="space-y-2">
          <label className="text-sm text-white/70 font-bold">Master Volume</label>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-white"
            />
            <div className="flex justify-between text-xs text-white/50 mt-1">
              <span>0</span>
              <span>10</span>
            </div>
          </div>
        </div>

        {/* Crossfader */}
        <div className="space-y-2">
          <label className="text-sm text-purple-400 font-bold">Crossfader</label>
          <div className="relative">
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={crossfader}
              onChange={(e) => handleCrossfaderChange(parseFloat(e.target.value))}
              className="w-full h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-purple"
            />
            <div className="flex justify-between text-xs text-white/50 mt-1">
              <span className="text-cyan-400">A</span>
              <span>MIX</span>
              <span className="text-purple-400">B</span>
            </div>
          </div>
        </div>

        {/* Cue Volume */}
        <div className="space-y-2">
          <label className="text-sm text-white/70 font-bold">Cue Volume</label>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={cueVolume}
              onChange={(e) => handleCueVolumeChange(parseFloat(e.target.value))}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-white"
            />
            <div className="flex justify-between text-xs text-white/50 mt-1">
              <span>0</span>
              <span>10</span>
            </div>
          </div>
        </div>

        {/* Crossfader Curve (Visual Indicator) */}
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 border border-purple-500/20">
          <div className="text-xs text-purple-400 font-bold mb-2">Crossfader Position</div>
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full transition-all ${
              crossfader < -0.3 ? 'bg-cyan-500 shadow-lg shadow-cyan-500/50' : 'bg-cyan-500/20'
            }`} />
            <div className="flex-1 bg-gray-700 h-1 rounded-full relative">
              <div 
                className="absolute top-0 w-3 h-3 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50 transform -translate-y-1"
                style={{ left: `${((crossfader + 1) / 2) * 100}%`, transform: 'translateX(-50%) translateY(-25%)' }}
              />
            </div>
            <div className={`w-4 h-4 rounded-full transition-all ${
              crossfader > 0.3 ? 'bg-purple-500 shadow-lg shadow-purple-500/50' : 'bg-purple-500/20'
            }`} />
          </div>
        </div>
      </div>
    </div>
  );
}