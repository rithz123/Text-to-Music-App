import React, { useState, useEffect, useRef } from 'react';
import Head from './Head.jsx';
import './App.css';

function App() {
  const [prompt, setPrompt] = useState('A soft acoustic playing in the background with a hint of lo-fi beats');
  const [loading, setLoading] = useState(false);
  const [useMock, setUseMock] = useState(true);
  const [backendUrl, setBackendUrl] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('offline');
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef(null);
  const visualizerBars = Array.from({ length: 24 });

  // Test backend connection
  useEffect(() => {
    if (useMock || !backendUrl) {
      setConnectionStatus('offline');
      return;
    }

    const checkConnection = async () => {
      setConnectionStatus('testing');
      try {
        const response = await fetch(backendUrl, { mode: 'cors' });
        if (response.ok) {
          setConnectionStatus('online');
        } else {
          setConnectionStatus('offline');
        }
      } catch (err) {
        setConnectionStatus('offline');
      }
    };

    // Debounce connection check
    const timeoutId = setTimeout(checkConnection, 1000);
    return () => clearTimeout(timeoutId);
  }, [backendUrl, useMock]);

  // Audio elements event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Play/Pause handler
  const togglePlay = () => {
    if (!audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.error("Playback failed", err));
      setIsPlaying(true);
    }
  };

  // Progress scrub handler
  const handleScrub = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Format time (mm:ss)
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Offline Web Audio Synth (Generates ambient chord progressions)
  const generateMockAudio = async (textPrompt) => {
    const sampleRate = 44100;
    const audioDuration = 10;
    const numSamples = sampleRate * audioDuration;
    const offlineCtx = new OfflineAudioContext(2, numSamples, sampleRate);

    // Prompt hashing to customize tones
    let hash = 0;
    for (let i = 0; i < textPrompt.length; i++) {
      hash = textPrompt.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Ambient chord selections (calm, warm, rich)
    const chordKeys = [
      [261.63, 329.63, 392.00, 493.88], // C Maj7 (Calm, bright)
      [293.66, 349.23, 440.00, 523.25], // D Min7 (Moody, reflective)
      [329.63, 392.00, 493.88, 587.33], // E Min7 (Deep, spacey)
      [349.23, 440.00, 523.25, 659.25], // F Maj7 (Dreamy, uplifting)
      [392.00, 493.88, 587.33, 698.46], // G Dom7 (Warm, resonant)
    ];
    
    const activeChord = chordKeys[Math.abs(hash) % chordKeys.length];

    // Build the ambient pad synthesizers
    activeChord.forEach((freq, idx) => {
      const osc = offlineCtx.createOscillator();
      // Alternate synth shapes for rich texture
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq / 2, 0); // lower register

      const gain = offlineCtx.createGain();
      gain.gain.setValueAtTime(0.0, 0);
      gain.gain.linearRampToValueAtTime(0.12, 2); // Slow attack
      gain.gain.exponentialRampToValueAtTime(0.04, audioDuration - 2);
      gain.gain.linearRampToValueAtTime(0.0, audioDuration); // Slow release

      const lowpass = offlineCtx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(600 + Math.sin(idx) * 150, 0);

      osc.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(offlineCtx.destination);

      osc.start(0);
      osc.stop(audioDuration);
    });

    // Gentle high chimes/notes
    const highNotes = activeChord.map(f => f * 2);
    for (let timeOffset = 1.0; timeOffset < audioDuration - 2; timeOffset += 1.8 + Math.random() * 1.5) {
      const noteFreq = highNotes[Math.floor(Math.random() * highNotes.length)];
      const osc = offlineCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(noteFreq, timeOffset);

      const gain = offlineCtx.createGain();
      gain.gain.setValueAtTime(0, timeOffset);
      gain.gain.linearRampToValueAtTime(0.08, timeOffset + 0.08); // Pluck attack
      gain.gain.exponentialRampToValueAtTime(0.0001, timeOffset + 1.5); // Decay

      const delay = offlineCtx.createDelay();
      delay.delayTime.setValueAtTime(0.25, timeOffset);
      const delayGain = offlineCtx.createGain();
      delayGain.gain.setValueAtTime(0.04, timeOffset);

      osc.connect(gain);
      gain.connect(offlineCtx.destination);

      // Connect to delay line
      gain.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(offlineCtx.destination);
      delayGain.connect(delay); // Feedback loop

      osc.start(timeOffset);
      osc.stop(timeOffset + 2.0);
    }

    const rendered = await offlineCtx.startRendering();
    const wavBlob = audioBufferToWav(rendered);
    return URL.createObjectURL(wavBlob);
  };

  // AudioBuffer to 16-bit WAV PCM Helper
  const audioBufferToWav = (buffer) => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArr = new ArrayBuffer(length);
    const view = new DataView(bufferArr);
    const channels = [];
    let offset = 0;
    let pos = 0;

    const setUint16 = (data) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    const setUint32 = (data) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // Header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // chunk length
    setUint16(1); // raw PCM format
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
    setUint16(numOfChan * 2); // block align
    setUint16(16); // bits per sample

    setUint32(0x61746164); // "data" chunk
    setUint32(length - pos - 4);

    // Interleave and write channel buffers
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }

    while (pos < length) {
      for (let c = 0; c < numOfChan; c++) {
        let sample = Math.max(-1, Math.min(1, channels[c][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([bufferArr], { type: 'audio/wav' });
  };

  // Generation Handler
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setIsPlaying(false);
    
    // Visual feedback reset
    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      if (useMock) {
        // Run synthesizer with a realistic 2.5s delay to simulate generation
        await new Promise(resolve => setTimeout(resolve, 2500));
        const url = await generateMockAudio(prompt);
        setAudioUrl(url);
      } else {
        // Fetch from FastAPI python endpoint
        const targetUrl = `${backendUrl.replace(/\/$/, '')}/generate?prompt=${encodeURIComponent(prompt)}`;
        const response = await fetch(targetUrl);
        
        if (!response.ok) {
          throw new Error(`Server returned status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to generate audio. Make sure the server is online and CORS is enabled.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-wrapper">
      <main className="main-content">
        <Head 
          prompt={prompt}
          setPrompt={setPrompt}
          onGenerate={handleGenerate}
          loading={loading}
          useMock={useMock}
          setUseMock={setUseMock}
          backendUrl={backendUrl}
          setBackendUrl={setBackendUrl}
          connectionStatus={connectionStatus}
        />

        {error && (
          <div className="error-message card">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* Audio Player and Visualizer */}
        {audioUrl && (
          <div className="audio-player-container card">
            <h2 className="section-title">Your Rendered Soundscape</h2>
            
            {/* Waveform Visualization */}
            <div className={`waveform-visualizer ${isPlaying ? 'active' : ''}`}>
              {visualizerBars.map((_, i) => (
                <div 
                  key={i} 
                  className="vis-bar" 
                  style={{ 
                    animationDelay: `${i * 0.08}s`,
                    animationDuration: `${0.6 + Math.random() * 0.8}s`
                  }} 
                />
              ))}
            </div>

            {/* Audio Ref Element */}
            <audio ref={audioRef} src={audioUrl} />

            {/* Custom Controls */}
            <div className="custom-controls">
              <button onClick={togglePlay} className="play-pause-btn" aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="control-icon">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="control-icon">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <div className="progress-group">
                <span className="time-display">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={currentTime}
                  onChange={handleScrub}
                  className="progress-slider"
                />
                <span className="time-display">{formatTime(duration)}</span>
              </div>

              <div className="volume-group">
                <svg viewBox="0 0 24 24" fill="currentColor" className="volume-icon">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="volume-slider"
                />
              </div>

              <a href={audioUrl} download={`${prompt.trim().replace(/\s+/g, '_').substring(0, 20)}_riri.wav`} className="download-btn" title="Download Audio">
                <svg viewBox="0 0 24 24" fill="currentColor" className="control-icon">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z" />
                </svg>
              </a>
            </div>
          </div>
        )}
      </main>
      
      <footer className="app-footer">
        <p>© 2026 Riri AI. Made with love for your inner world.</p>
      </footer>
    </div>
  );
}

export default App;
