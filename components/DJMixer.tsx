'use client';

import { useState, useEffect } from 'react';
import { DeckLeft } from '@/components/DeckLeft';
import { DeckRight } from '@/components/DeckRight';
import { MixerControls } from '@/components/MixerControls';
import { AudioEngine } from '@/lib/AudioEngine';
import { TrackInfo } from '@/lib/types';

export function DJMixer() {
  const [audioEngine, setAudioEngine] = useState<AudioEngine | null>(null);
  const [leftTrack, setLeftTrack] = useState<TrackInfo | null>(null);
  const [rightTrack, setRightTrack] = useState<TrackInfo | null>(null);

  useEffect(() => {
    const engine = new AudioEngine();
    setAudioEngine(engine);

    // Load persisted tracks
    const savedLeftTrack = localStorage.getItem('dj_left_track');
    const savedRightTrack = localStorage.getItem('dj_right_track');
    
    if (savedLeftTrack) {
      setLeftTrack(JSON.parse(savedLeftTrack));
    }
    
    if (savedRightTrack) {
      setRightTrack(JSON.parse(savedRightTrack));
    }

    return () => {
      engine.cleanup();
    };
  }, []);

  const handleTrackLoad = (deck: 'left' | 'right', track: TrackInfo) => {
    if (deck === 'left') {
      setLeftTrack(track);
      localStorage.setItem('dj_left_track', JSON.stringify(track));
    } else {
      setRightTrack(track);
      localStorage.setItem('dj_right_track', JSON.stringify(track));
    }
  };

  if (!audioEngine) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400 text-xl font-bold animate-pulse">
          Initializing SpektralDJ...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-sm border-b border-cyan-500/30 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-magenta-400 bg-clip-text text-transparent">
            SpektralDJ
          </h1>
          <div className="text-cyan-400/70 text-sm">
            Professional DJ Mixer
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 min-h-[calc(100vh-80px)]">
        {/* Left Deck */}
        <div className="xl:col-span-1">
          <DeckLeft 
            audioEngine={audioEngine}
            track={leftTrack}
            onTrackLoad={(track) => handleTrackLoad('left', track)}
          />
        </div>

        {/* Center Mixer */}
        <div className="xl:col-span-1">
          <MixerControls audioEngine={audioEngine} />
        </div>

        {/* Right Deck */}
        <div className="xl:col-span-1">
          <DeckRight 
            audioEngine={audioEngine}
            track={rightTrack}
            onTrackLoad={(track) => handleTrackLoad('right', track)}
          />
        </div>
      </div>
    </div>
  );
}