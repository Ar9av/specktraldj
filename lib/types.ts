export interface TrackInfo {
  id: string;
  title: string;
  artist: string;
  duration: number;
  fileSize: number;
  buffer?: AudioBuffer;
  bpm?: number;
  waveformData?: number[];
}

export interface LoopInfo {
  start: number;
  end: number;
  isActive: boolean;
  isRolling: boolean;
}

export interface DeckState {
  isPlaying: boolean;
  currentTime: number;
  bpm: number;
  volume: number;
  gain: number;
  eqLow: number;
  eqMid: number;
  eqHigh: number;
  loop: LoopInfo;
  cueActive: boolean;
  syncActive: boolean;
}