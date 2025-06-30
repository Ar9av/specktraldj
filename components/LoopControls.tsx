'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LoopControlsProps {
  deck: any; // DeckAudio instance
  currentTime: number;
  isPlaying: boolean;
}

export function LoopControls({ deck, currentTime, isPlaying }: LoopControlsProps) {
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('1');

  const presetOptions = [
    { value: '0.125', label: '1/8' },
    { value: '0.25', label: '1/4' },
    { value: '0.5', label: '1/2' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '4', label: '4' }
  ];

  const handleSetIn = () => {
    deck.setLoopIn();
    setLoopStart(deck.loopStart);
  };

  const handleSetOut = () => {
    deck.setLoopOut();
    setLoopEnd(deck.loopEnd);
  };

  const handleToggleLoop = () => {
    deck.toggleLoop();
    setIsLooping(deck.isLooping);
  };

  const handleLoopRollDown = () => {
    setIsRolling(true);
    deck.startLoopRoll();
  };

  const handleLoopRollUp = () => {
    setIsRolling(false);
    deck.stopLoopRoll();
  };

  const handleNudgeLeft = () => {
    deck.nudgeLoop(-1);
    setLoopStart(deck.loopStart);
    setLoopEnd(deck.loopEnd);
  };

  const handleNudgeRight = () => {
    deck.nudgeLoop(1);
    setLoopStart(deck.loopStart);
    setLoopEnd(deck.loopEnd);
  };

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    deck.setLoopPreset(parseFloat(value));
    setLoopEnd(deck.loopEnd);
  };

  const loopProgress = isLooping && loopEnd > loopStart
    ? ((currentTime - loopStart) % (loopEnd - loopStart)) / (loopEnd - loopStart)
    : 0;

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-yellow-500/30 p-4">
      <h3 className="text-sm font-bold text-yellow-400 mb-3">LOOP CONTROLS</h3>
      
      <div className="space-y-4">
        {/* Set In/Out Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleSetIn}
            className="flex-1 py-2 px-3 bg-cyan-500/20 text-cyan-400 rounded-lg font-bold text-sm hover:bg-cyan-500/40 transition-all border border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/25"
          >
            Set In
          </button>
          <button
            onClick={handleSetOut}
            className="flex-1 py-2 px-3 bg-cyan-500/20 text-cyan-400 rounded-lg font-bold text-sm hover:bg-cyan-500/40 transition-all border border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/25"
          >
            Set Out
          </button>
        </div>

        {/* Loop Toggle with Progress Ring */}
        <div className="flex justify-center">
          <button
            onClick={handleToggleLoop}
            disabled={loopStart >= loopEnd}
            className={`
              relative w-20 h-20 rounded-full font-bold text-sm transition-all disabled:opacity-50
              ${isLooping 
                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50' 
                : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/40 border border-yellow-500/50'
              }
            `}
          >
            {isLooping && (
              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="rgba(0, 0, 0, 0.2)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="rgba(0, 0, 0, 0.8)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="226"
                    strokeDashoffset={226 - (loopProgress * 226)}
                    className="transition-all duration-100"
                  />
                </svg>
              </div>
            )}
            LOOP
          </button>
        </div>

        {/* Loop Roll */}
        <button
          onMouseDown={handleLoopRollDown}
          onMouseUp={handleLoopRollUp}
          onMouseLeave={handleLoopRollUp}
          disabled={loopStart >= loopEnd}
          className={`
            w-full py-3 rounded-lg font-bold transition-all disabled:opacity-50
            ${isRolling
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50 animate-pulse'
              : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/40 border border-orange-500/30'
            }
          `}
        >
          LOOP ROLL (Hold)
        </button>

        {/* Nudge Controls */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handleNudgeLeft}
            disabled={loopStart >= loopEnd}
            className="w-10 h-10 rounded-lg bg-white/20 text-white hover:bg-white/40 transition-all disabled:opacity-50 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="text-sm text-white/70 font-mono">NUDGE</span>
          
          <button
            onClick={handleNudgeRight}
            disabled={loopStart >= loopEnd}
            className="w-10 h-10 rounded-lg bg-white/20 text-white hover:bg-white/40 transition-all disabled:opacity-50 flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Dropdown */}
        <div className="space-y-2">
          <label className="text-xs text-white/70">Loop Length (Bars)</label>
          <select
            value={selectedPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full bg-gray-800 border border-pink-500/30 rounded-lg px-3 py-2 text-pink-400 focus:border-pink-500 focus:outline-none"
          >
            {presetOptions.map(option => (
              <option key={option.value} value={option.value} className="bg-gray-800">
                {option.label} Bar{option.value !== '1' ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Loop Status */}
        {loopStart < loopEnd && (
          <div className="text-xs text-center space-y-1">
            <div className="text-cyan-400">
              Loop: {loopStart.toFixed(1)}s - {loopEnd.toFixed(1)}s
            </div>
            <div className="text-cyan-400/70">
              Duration: {(loopEnd - loopStart).toFixed(1)}s
            </div>
          </div>
        )}
      </div>
    </div>
  );
}