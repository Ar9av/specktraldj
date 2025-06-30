'use client';

import { useState, useCallback, useRef } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { VinylDeck } from '@/components/VinylDeck';
import { LoopControls } from '@/components/LoopControls';
import { AudioEngine } from '@/lib/AudioEngine';
import { TrackInfo } from '@/lib/types';

interface DeckLeftProps {
  audioEngine: AudioEngine;
  track: TrackInfo | null;
  onTrackLoad: (track: TrackInfo) => void;
}

export function DeckLeft({ audioEngine, track, onTrackLoad }: DeckLeftProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [gain, setGain] = useState(0.5);
  const [eqLow, setEqLow] = useState(0.5);
  const [eqMid, setEqMid] = useState(0.5);
  const [eqHigh, setEqHigh] = useState(0.5);
  const [killLow, setKillLow] = useState(false);
  const [killMid, setKillMid] = useState(false);
  const [killHigh, setKillHigh] = useState(false);
  const [cueActive, setCueActive] = useState(false);
  const [syncActive, setSyncActive] = useState(false);
  
  const deck = audioEngine.getDeck('left');
  const timeUpdateRef = useRef<number>();

  const updateTime = useCallback(() => {
    if (isPlaying) {
      setCurrentTime(deck.savedOffset + (audioEngine.getCurrentTime() - deck.playStartTime));
      timeUpdateRef.current = requestAnimationFrame(updateTime);
    }
  }, [isPlaying, deck, audioEngine]);

  const handlePlay = () => {
    if (!track?.buffer) return;
    
    if (isPlaying) {
      deck.pause();
      setIsPlaying(false);
      if (timeUpdateRef.current) {
        cancelAnimationFrame(timeUpdateRef.current);
      }
    } else {
      deck.play();
      setIsPlaying(true);
      updateTime();
    }
  };

  const handleTrackLoaded = (loadedTrack: TrackInfo) => {
    if (loadedTrack.buffer) {
      deck.setBuffer(loadedTrack.buffer);
    }
    onTrackLoad(loadedTrack);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    deck.setVolume(value);
  };

  const handleGainChange = (value: number) => {
    setGain(value);
    // Gain is typically applied as a multiplier
    deck.setVolume(volume * (value * 2)); // 0-1 becomes 0-2x multiplier
  };

  const handleEQChange = (band: 'low' | 'mid' | 'high', value: number) => {
    deck.setEQ(band, value);
    if (band === 'low') setEqLow(value);
    if (band === 'mid') setEqMid(value);
    if (band === 'high') setEqHigh(value);
  };

  const handleEQKill = (band: 'low' | 'mid' | 'high') => {
    const isKilled = band === 'low' ? killLow : band === 'mid' ? killMid : killHigh;
    deck.killEQ(band, !isKilled);
    
    if (band === 'low') setKillLow(!killLow);
    if (band === 'mid') setKillMid(!killMid);
    if (band === 'high') setKillHigh(!killHigh);
  };

  const handleCue = (active: boolean) => {
    setCueActive(active);
    deck.setCue(active);
  };

  const handleSync = () => {
    setSyncActive(true);
    const rightDeck = audioEngine.getDeck('right');
    deck.sync(rightDeck.bpm);
    setTimeout(() => setSyncActive(false), 1000);
  };

  const handleSeek = (position: number) => {
    deck.seek(position);
    setCurrentTime(position);
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-cyan-500/30 p-6 h-full">
      <div className="flex flex-col h-full space-y-6">
        {/* Deck Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-cyan-400">DECK A</h2>
          <div className="flex space-x-2">
            <button
              onMouseDown={() => handleCue(true)}
              onMouseUp={() => handleCue(false)}
              onMouseLeave={() => handleCue(false)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                cueActive 
                  ? 'bg-magenta-500 text-white shadow-lg shadow-magenta-500/50' 
                  : 'bg-magenta-500/20 text-magenta-400 hover:bg-magenta-500/40'
              }`}
            >
              CUE
            </button>
            <button
              onClick={handleSync}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                syncActive 
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 animate-pulse' 
                  : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/40'
              }`}
            >
              SYNC
            </button>
          </div>
        </div>

        {/* File Upload */}
        <FileUpload onTrackLoad={handleTrackLoaded} track={track} />

        {/* Vinyl Deck */}
        {track && (
          <VinylDeck 
            track={track}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onSeek={handleSeek}
            bpm={deck.bpm}
          />
        )}

        {/* Transport Controls */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handlePlay}
            disabled={!track?.buffer}
            className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl transition-all ${
              isPlaying
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50'
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/40 disabled:opacity-50'
            }`}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>

        {/* Loop Controls */}
        {track && (
          <LoopControls 
            deck={deck}
            currentTime={currentTime}
            isPlaying={isPlaying}
          />
        )}

        {/* Volume & Gain */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-cyan"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70">Gain</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={gain}
              onChange={(e) => handleGainChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-orange"
            />
          </div>
        </div>

        {/* EQ Controls */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white/70">EQUALIZER</h3>
          
          <div className="space-y-3">
            {/* High */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleEQKill('high')}
                className={`w-8 h-8 rounded font-bold text-xs transition-all ${
                  killHigh 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/50' 
                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/40'
                }`}
              >
                HI
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={eqHigh}
                onChange={(e) => handleEQChange('high', parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-green"
              />
            </div>

            {/* Mid */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleEQKill('mid')}
                className={`w-8 h-8 rounded font-bold text-xs transition-all ${
                  killMid 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/50' 
                    : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/40'
                }`}
              >
                MD
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={eqMid}
                onChange={(e) => handleEQChange('mid', parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-yellow"
              />
            </div>

            {/* Low */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleEQKill('low')}
                className={`w-8 h-8 rounded font-bold text-xs transition-all ${
                  killLow 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/50' 
                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/40'
                }`}
              >
                LO
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={eqLow}
                onChange={(e) => handleEQChange('low', parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-red"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}