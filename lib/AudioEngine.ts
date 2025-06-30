export class AudioEngine {
  private context: AudioContext;
  private masterGain: GainNode;
  private cueGain: GainNode;
  private leftDeck: DeckAudio;
  private rightDeck: DeckAudio;
  private crossfader: GainNode;
  private analyzer: AnalyserNode;
  
  constructor() {
    this.context = new AudioContext();
    this.setupAudioGraph();
    this.leftDeck = new DeckAudio(this.context, 'left');
    this.rightDeck = new DeckAudio(this.context, 'right');
    this.connectDecks();
  }

  private setupAudioGraph() {
    this.masterGain = this.context.createGain();
    this.cueGain = this.context.createGain();
    this.crossfader = this.context.createGain();
    this.analyzer = this.context.createAnalyser();
    
    this.analyzer.fftSize = 2048;
    this.masterGain.connect(this.analyzer);
    this.analyzer.connect(this.context.destination);
    this.cueGain.connect(this.context.destination);
  }

  private connectDecks() {
    this.leftDeck.connect(this.masterGain);
    this.rightDeck.connect(this.masterGain);
    this.leftDeck.connectCue(this.cueGain);
    this.rightDeck.connectCue(this.cueGain);
  }

  getDeck(side: 'left' | 'right'): DeckAudio {
    return side === 'left' ? this.leftDeck : this.rightDeck;
  }

  getAnalyzer(): AnalyserNode {
    return this.analyzer;
  }

  getFrequencyData(): Uint8Array {
    const data = new Uint8Array(this.analyzer.frequencyBinCount);
    this.analyzer.getByteFrequencyData(data);
    return data;
  }

  getTimeDomainData(): Uint8Array {
    const data = new Uint8Array(this.analyzer.frequencyBinCount);
    this.analyzer.getByteTimeDomainData(data);
    return data;
  }

  setCrossfader(value: number) {
    // -1 = full left, 0 = center, 1 = full right
    const leftGain = Math.cos((value + 1) * Math.PI / 4);
    const rightGain = Math.sin((value + 1) * Math.PI / 4);
    
    this.leftDeck.setCrossfaderGain(leftGain);
    this.rightDeck.setCrossfaderGain(rightGain);
  }

  setMasterVolume(value: number) {
    this.masterGain.gain.value = value;
  }

  setCueVolume(value: number) {
    this.cueGain.gain.value = value;
  }

  cleanup() {
    this.leftDeck.cleanup();
    this.rightDeck.cleanup();
    this.context.close();
  }
}

class DeckAudio {
  private context: AudioContext;
  private side: string;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private cueSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private cueGainNode: GainNode;
  private crossfaderGain: GainNode;
  private eqLow: BiquadFilterNode;
  private eqMid: BiquadFilterNode;
  private eqHigh: BiquadFilterNode;
  
  // State
  public bpm: number = 120;
  public isPlaying: boolean = false;
  public currentTime: number = 0;
  public savedOffset: number = 0;
  public playStartTime: number = 0;
  public loopStart: number = 0;
  public loopEnd: number = 0;
  public isLooping: boolean = false;
  public rollSource: AudioBufferSourceNode | null = null;
  public rollStartTime: number = 0;

  constructor(context: AudioContext, side: string) {
    this.context = context;
    this.side = side;
    this.setupAudioGraph();
  }

  private setupAudioGraph() {
    this.gainNode = this.context.createGain();
    this.cueGainNode = this.context.createGain();
    this.crossfaderGain = this.context.createGain();
    
    // EQ Setup
    this.eqLow = this.context.createBiquadFilter();
    this.eqMid = this.context.createBiquadFilter();
    this.eqHigh = this.context.createBiquadFilter();
    
    this.eqLow.type = 'lowshelf';
    this.eqLow.frequency.value = 320;
    this.eqLow.gain.value = 0;
    
    this.eqMid.type = 'peaking';
    this.eqMid.frequency.value = 1000;
    this.eqMid.Q.value = 1;
    this.eqMid.gain.value = 0;
    
    this.eqHigh.type = 'highshelf';
    this.eqHigh.frequency.value = 3200;
    this.eqHigh.gain.value = 0;
    
    // Chain: source -> EQ -> gain -> crossfader
    this.eqLow.connect(this.eqMid);
    this.eqMid.connect(this.eqHigh);
    this.eqHigh.connect(this.gainNode);
    this.gainNode.connect(this.crossfaderGain);
  }

  setBuffer(buffer: AudioBuffer) {
    this.buffer = buffer;
    this.bpm = this.estimateBPM(buffer);
  }

  private estimateBPM(buffer: AudioBuffer): number {
    // Simplified BPM detection - in production would use more sophisticated algorithm
    const sampleRate = buffer.sampleRate;
    const channelData = buffer.getChannelData(0);
    const bufferSize = 1024;
    let peaks = 0;
    let threshold = 0.1;
    
    for (let i = 0; i < channelData.length - bufferSize; i += bufferSize) {
      let sum = 0;
      for (let j = 0; j < bufferSize; j++) {
        sum += Math.abs(channelData[i + j]);
      }
      if (sum / bufferSize > threshold) {
        peaks++;
      }
    }
    
    const peakRate = peaks / (channelData.length / sampleRate);
    return Math.round(peakRate * 60 * 4); // Estimate BPM
  }

  private createSource(looped: boolean = false): AudioBufferSourceNode {
    if (!this.buffer) throw new Error('No buffer loaded');
    
    const source = this.context.createBufferSource();
    source.buffer = this.buffer;
    source.loop = looped && this.isLooping;
    
    if (looped && this.isLooping) {
      source.loopStart = this.loopStart;
      source.loopEnd = this.loopEnd;
    }
    
    source.connect(this.eqLow);
    return source;
  }

  play() {
    if (!this.buffer || this.isPlaying) return;
    
    this.source = this.createSource(this.isLooping);
    this.playStartTime = this.context.currentTime;
    this.source.start(0, this.savedOffset);
    this.isPlaying = true;
  }

  pause() {
    if (!this.isPlaying || !this.source) return;
    
    this.currentTime = (this.context.currentTime - this.playStartTime) + this.savedOffset;
    this.savedOffset = this.currentTime;
    this.source.stop();
    this.source = null;
    this.isPlaying = false;
    
    // Clear loop if not actively holding loop toggle
    if (!this.isLooping) {
      this.loopStart = 0;
      this.loopEnd = 0;
    }
  }

  stop() {
    if (this.source) {
      this.source.stop();
      this.source = null;
    }
    this.isPlaying = false;
    this.savedOffset = 0;
    this.currentTime = 0;
  }

  seek(position: number) {
    this.savedOffset = position;
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  setVolume(value: number) {
    this.gainNode.gain.value = value;
  }

  setEQ(band: 'low' | 'mid' | 'high', value: number) {
    const gain = (value - 0.5) * 24; // -12dB to +12dB range
    
    switch (band) {
      case 'low':
        this.eqLow.gain.value = gain;
        break;
      case 'mid':
        this.eqMid.gain.value = gain;
        break;
      case 'high':
        this.eqHigh.gain.value = gain;
        break;
    }
  }

  killEQ(band: 'low' | 'mid' | 'high', kill: boolean) {
    const filter = band === 'low' ? this.eqLow : band === 'mid' ? this.eqMid : this.eqHigh;
    filter.gain.value = kill ? -40 : 0; // -40dB = effectively muted
  }

  setCue(active: boolean) {
    if (!this.buffer) return;
    
    if (active) {
      const pos = (this.context.currentTime - this.playStartTime) + this.savedOffset;
      this.cueSource = this.context.createBufferSource();
      this.cueSource.buffer = this.buffer;
      this.cueSource.connect(this.cueGainNode);
      this.cueSource.start(0, pos);
    } else {
      if (this.cueSource) {
        this.cueSource.stop();
        this.cueSource = null;
      }
    }
  }

  setLoopIn() {
    const currentPos = this.getCurrentPosition();
    this.loopStart = this.snapToBeat(currentPos);
  }

  setLoopOut() {
    const currentPos = this.getCurrentPosition();
    this.loopEnd = this.snapToBeat(currentPos);
  }

  toggleLoop() {
    this.isLooping = !this.isLooping;
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  startLoopRoll() {
    if (!this.buffer || this.loopStart >= this.loopEnd) return;
    
    this.pause();
    this.rollSource = this.createSource(true);
    this.rollStartTime = this.context.currentTime;
    this.rollSource.start(0, this.loopStart);
  }

  stopLoopRoll() {
    if (this.rollSource) {
      this.rollSource.stop();
      const playedTime = this.context.currentTime - this.rollStartTime;
      const loopDuration = this.loopEnd - this.loopStart;
      this.savedOffset = this.loopStart + (playedTime % loopDuration);
      this.rollSource = null;
      this.play();
    }
  }

  nudgeLoop(beats: number) {
    const secondsPerBeat = 60 / this.bpm;
    const nudgeAmount = beats * secondsPerBeat;
    this.loopStart += nudgeAmount;
    this.loopEnd += nudgeAmount;
    
    if (this.isLooping && this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  setLoopPreset(bars: number) {
    const secondsPerBar = (60 / this.bpm) * 4;
    this.loopEnd = this.loopStart + (bars * secondsPerBar);
    
    if (this.isLooping && this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  sync(targetBPM: number) {
    if (!this.buffer || this.bpm === targetBPM) return;
    
    const ratio = targetBPM / this.bpm;
    const wasPlaying = this.isPlaying;
    
    if (wasPlaying) this.pause();
    
    // Update BPM and playback rate would be handled by the source
    this.bpm = targetBPM;
    
    if (wasPlaying) this.play();
  }

  private snapToBeat(time: number): number {
    const secondsPerBeat = 60 / this.bpm;
    return Math.round(time / secondsPerBeat) * secondsPerBeat;
  }

  private getCurrentPosition(): number {
    if (this.isPlaying && this.source) {
      return (this.context.currentTime - this.playStartTime) + this.savedOffset;
    }
    return this.savedOffset;
  }

  connect(destination: AudioNode) {
    this.crossfaderGain.connect(destination);
  }

  connectCue(destination: AudioNode) {
    this.cueGainNode.connect(destination);
  }

  setCrossfaderGain(value: number) {
    this.crossfaderGain.gain.value = value;
  }

  cleanup() {
    if (this.source) this.source.stop();
    if (this.cueSource) this.cueSource.stop();
    if (this.rollSource) this.rollSource.stop();
  }
}