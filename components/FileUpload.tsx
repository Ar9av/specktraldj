'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Music, AlertCircle, Check } from 'lucide-react';
import { TrackInfo } from '@/lib/types';

interface FileUploadProps {
  onTrackLoad: (track: TrackInfo) => void;
  track: TrackInfo | null;
}

export function FileUpload({ onTrackLoad, track }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFormats = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/mp4', 'audio/m4a'];

  const validateFile = (file: File): boolean => {
    const isValidType = acceptedFormats.some(format => 
      file.type === format || file.name.toLowerCase().endsWith(format.split('/')[1])
    );
    
    if (!isValidType) {
      setError('Invalid file type. Please upload MP3, WAV, or M4A files only.');
      // Shake animation
      setTimeout(() => setError(null), 3000);
      return false;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('File too large. Maximum size is 50MB.');
      setTimeout(() => setError(null), 3000);
      return false;
    }
    
    return true;
  };

  const extractMetadata = (file: File): Promise<{ title: string; artist: string }> => {
    return new Promise((resolve) => {
      // Simple metadata extraction from filename
      const name = file.name.replace(/\.(mp3|wav|m4a)$/i, '');
      const parts = name.split(' - ');
      
      if (parts.length >= 2) {
        resolve({
          artist: parts[0].trim(),
          title: parts[1].trim()
        });
      } else {
        resolve({
          artist: 'Unknown Artist',
          title: name
        });
      }
    });
  };

  const decodeAudioFile = async (file: File): Promise<TrackInfo> => {
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new AudioContext();
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 100);
    
    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const metadata = await extractMetadata(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      const trackInfo: TrackInfo = {
        id: Date.now().toString(),
        title: metadata.title,
        artist: metadata.artist,
        duration: audioBuffer.duration,
        fileSize: file.size,
        buffer: audioBuffer,
        bpm: 120 // Will be calculated by AudioEngine
      };
      
      return trackInfo;
    } catch (err) {
      clearInterval(progressInterval);
      throw new Error('Failed to decode audio file');
    } finally {
      audioContext.close();
    }
  };

  const handleFile = useCallback(async (file: File) => {
    if (!validateFile(file)) return;
    
    setIsLoading(true);
    setProgress(0);
    setError(null);
    
    try {
      const track = await decodeAudioFile(file);
      onTrackLoad(track);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load track');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [onTrackLoad]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (track && !isLoading) {
    return (
      <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-cyan-500/50 p-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white truncate">{track.title}</h3>
            <p className="text-sm text-cyan-400 truncate">{track.artist}</p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-white/60">
              <span>{formatDuration(track.duration)}</span>
              <span>{formatFileSize(track.fileSize)}</span>
              {track.bpm && <span>{Math.round(track.bpm)} BPM</span>}
            </div>
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/40 transition-all border border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/25"
          >
            Replace
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.m4a,audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
          ${isDragging 
            ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/25' 
            : 'border-gray-600 hover:border-cyan-500/50 hover:bg-cyan-500/5'
          }
          ${error ? 'border-red-500 bg-red-500/10 animate-shake' : ''}
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        {isLoading ? (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto bg-magenta-500/20 rounded-full flex items-center justify-center animate-pulse">
              <Music className="w-6 h-6 text-magenta-400" />
            </div>
            <div className="space-y-2">
              <p className="text-white font-medium">Decoding audio...</p>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-magenta-500 to-purple-500 h-2 rounded-full transition-all duration-300 animate-pulse"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-magenta-400">{progress}%</p>
            </div>
          </div>
        ) : error ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-red-400 font-medium">{error}</p>
            <p className="text-sm text-white/60">Click to try again</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center transition-all ${
              isDragging 
                ? 'bg-cyan-500/30 shadow-lg shadow-cyan-500/25' 
                : 'bg-gray-700'
            }`}>
              <Upload className={`w-6 h-6 transition-colors ${
                isDragging ? 'text-cyan-300' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <p className="text-white font-medium">
                {isDragging ? 'Drop your track here' : 'Drop MP3/WAV/M4A here'}
              </p>
              <p className="text-sm text-white/60 mt-1">
                or click to browse files
              </p>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.m4a,audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      
      {!track && !isLoading && (
        <div className="text-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            Browse Files
          </button>
        </div>
      )}
    </div>
  );
}